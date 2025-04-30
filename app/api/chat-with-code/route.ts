import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenAI, Type } from "@google/genai"

// Initialize the Gemini API client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set")
  }
  return new GoogleGenAI({ apiKey })
}

// Helper function to create a streaming response
function createStreamResponse(stream: ReadableStream) {
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { generationId, message, files, currentCode } = await request.json()

    // Log the received code lengths to verify what's being received
    console.log("API received code:", {
      htmlLength: currentCode?.html?.length || 0,
      cssLength: currentCode?.css?.length || 0,
      jsLength: currentCode?.js?.length || 0,
      messageLength: message?.length || 0,
    })

    if (!message && (!files || files.length === 0)) {
      return NextResponse.json({ error: "Message or files are required" }, { status: 400 })
    }

    const genAI = getGeminiClient()

    // Define the function declaration for code editing
    const editCodeFunctionDeclaration = {
      name: "edit_website_code",
      description: "Edits the HTML, CSS, and JavaScript code of a website based on user request.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          html: {
            type: Type.STRING,
            description: "The complete updated HTML code with changes applied.",
          },
          css: {
            type: Type.STRING,
            description: "The complete updated CSS code with changes applied.",
          },
          js: {
            type: Type.STRING,
            description: "The complete updated JavaScript code with changes applied.",
          },
          explanation: {
            type: Type.STRING,
            description: "A brief explanation of the changes made to the code.",
          },
        },
        required: ["html", "css", "js", "explanation"],
      },
    }

    // Update the system instructions to focus on modifying only the existing code
    const systemInstruction = {
      parts: [
        {
          text: `You are an expert web developer assistant that helps users refine their website code. 
          You have access to the current HTML, CSS, and JavaScript code of the website.
          
          IMPORTANT INSTRUCTIONS:
          1. The code provided to you is the CURRENT state of the website. Always work with this exact code.
          2. ONLY modify the existing code based on the user's request. DO NOT rewrite the entire codebase.
          3. Preserve the overall structure, IDs, classes, and functionality of the original code.
          4. You should respond in two ways:
             a. Call the edit_website_code function with the updated code and an explanation
             b. Provide a conversational response explaining what you did
          5. Make sure your changes are valid and won't break the website.
          
          Current HTML:
          \`\`\`html
          ${currentCode.html}
          \`\`\`
          
          Current CSS:
          \`\`\`css
          ${currentCode.css}
          \`\`\`
          
          Current JavaScript:
          \`\`\`javascript
          ${currentCode.js}
          \`\`\`
          `,
        },
      ],
    }

    // Create a chat session with specific configuration
    const chat = genAI.chats.create({
      model: "gemini-2.5-pro-preview-03-25",
      systemInstruction: systemInstruction,
      config: {
        temperature: 0.2, // Lower temperature for more conservative changes
        topP: 0.8,
        topK: 40,
        tools: [
          {
            functionDeclarations: [editCodeFunctionDeclaration],
          },
        ],
      },
    })

    // Create a stream for the response
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Process the stream in the background
    ;(async () => {
      try {
        let responseText = ""

        // Prepare the message content
        const userMessage = { role: "user", parts: [] as any[] }

        // Add text message with clear instruction to modify existing code
        if (message) {
          userMessage.parts.push({
            text: `Please make the following changes to the existing code while preserving the overall structure and functionality: ${message}`,
          })
        }

        // Add files if provided
        if (files && files.length > 0) {
          for (const file of files) {
            userMessage.parts.push({
              inlineData: {
                data: file.data,
                mimeType: file.mimeType,
              },
            })
          }
        }

        // Send the message to Gemini and stream the response
        const chatStream = await chat.sendMessageStream({
          message: userMessage,
        })

        for await (const chunk of chatStream) {
          if (chunk.text) {
            responseText += chunk.text

            // Send the chunk to the client
            const data = {
              type: "content",
              content: chunk.text,
            }
            await writer.write(encoder.encode(JSON.stringify(data) + "\n"))
          }

          // Check for function calls
          if (chunk.functionCalls && chunk.functionCalls.length > 0) {
            const functionCall = chunk.functionCalls[0]
            if (functionCall.name === "edit_website_code") {
              const args = functionCall.args

              // Send code updates to the client
              const codeUpdates = {
                type: "code",
                html: args.html,
                css: args.css,
                js: args.js,
              }

              await writer.write(encoder.encode(JSON.stringify(codeUpdates) + "\n"))

              // Also send the explanation as content
              const explanationData = {
                type: "content",
                content: `\n\n**Changes made:** ${args.explanation}`,
              }
              await writer.write(encoder.encode(JSON.stringify(explanationData) + "\n"))
            }
          }
        }

        await writer.close()
      } catch (error) {
        console.error("Error in chat stream:", error)
        const errorMessage = {
          type: "error",
          message: "An error occurred while processing your request",
        }
        await writer.write(encoder.encode(JSON.stringify(errorMessage) + "\n"))
        await writer.close()
      }
    })()

    return createStreamResponse(stream.readable)
  } catch (error) {
    console.error("Error in chat-with-code API:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
