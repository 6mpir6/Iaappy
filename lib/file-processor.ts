import { GoogleGenAI } from "@google/genai"

// Initialize the Gemini API client
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set")
  }
  return new GoogleGenAI({ apiKey })
}

// Process files for multimodal understanding
export async function processFilesForWebsiteGeneration(prompt: string, files: { data: string; mimeType: string }[]) {
  try {
    const genAI = getGeminiClient()
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Prepare the content parts
    const contents: any[] = [{ text: prompt }]

    // Add files to the content
    for (const file of files) {
      contents.push({
        inlineData: {
          data: file.data,
          mimeType: file.mimeType,
        },
      })
    }

    // Generate content with multimodal understanding
    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    })

    return result.response.text()
  } catch (error) {
    console.error("Error processing files for website generation:", error)
    throw error
  }
}

// Process files for the File API (for larger files)
export async function processLargeFilesForWebsiteGeneration(prompt: string, filePaths: string[]) {
  try {
    const genAI = getGeminiClient()

    // Upload files using the File API
    const uploadedFiles = await Promise.all(
      filePaths.map(async (filePath) => {
        const file = await genAI.files.upload({
          file: filePath,
        })

        // Wait for the file to be processed
        let getFile = await genAI.files.get({ name: file.name })
        while (getFile.state === "PROCESSING") {
          await new Promise((resolve) => setTimeout(resolve, 5000))
          getFile = await genAI.files.get({ name: file.name })
        }

        if (getFile.state === "FAILED") {
          throw new Error(`File processing failed for ${filePath}`)
        }

        return {
          uri: getFile.uri,
          mimeType: getFile.mimeType,
        }
      }),
    )

    // Prepare the content parts
    const contents: any[] = [{ text: prompt }]

    // Add file URIs to the content
    for (const file of uploadedFiles) {
      contents.push({
        fileData: {
          fileUri: file.uri,
          mimeType: file.mimeType,
        },
      })
    }

    // Generate content with multimodal understanding
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    })

    return result.response.text()
  } catch (error) {
    console.error("Error processing large files for website generation:", error)
    throw error
  }
}
