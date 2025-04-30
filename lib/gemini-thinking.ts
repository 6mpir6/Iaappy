import { GoogleGenAI } from "@google/genai"

/**
 * Initialize the Gemini AI client
 * @returns GoogleGenAI instance
 */
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set")
  }
  return new GoogleGenAI({ apiKey })
}

/**
 * Clean and repair malformed JSON
 * @param jsonString Potentially malformed JSON string
 * @returns Cleaned JSON string
 */
function repairJson(jsonString: string): string {
  try {
    // Remove any markdown code block markers
    let cleaned = jsonString.replace(/```json|```/g, "").trim()

    // Handle truncated JSON by adding missing closing brackets
    const openBraces = (cleaned.match(/\{/g) || []).length
    const closeBraces = (cleaned.match(/\}/g) || []).length
    if (openBraces > closeBraces) {
      cleaned = cleaned + "}".repeat(openBraces - closeBraces)
    }

    const openBrackets = (cleaned.match(/\[/g) || []).length
    const closeBrackets = (cleaned.match(/\]/g) || []).length
    if (openBrackets > closeBrackets) {
      cleaned = cleaned + "]".repeat(openBrackets - closeBrackets)
    }

    // Fix unquoted property names
    cleaned = cleaned.replace(/(\s*?)(\w+)(\s*?):/g, '"$2":')

    // Fix missing commas between properties
    cleaned = cleaned.replace(/}(\s*?){/g, "},\n{")
    cleaned = cleaned.replace(/"([^"]+)"\s*:\s*("[^"]*"|[\d.]+|true|false|null)\s+"/g, '"$1": $2,\n"')

    // Fix single quotes to double quotes (but not inside already double-quoted strings)
    let inDoubleQuotes = false
    let result = ""

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i]
      const prevChar = i > 0 ? cleaned[i - 1] : ""

      if (char === '"' && prevChar !== "\\") {
        inDoubleQuotes = !inDoubleQuotes
        result += char
      } else if (char === "'" && !inDoubleQuotes) {
        result += '"'
      } else {
        result += char
      }
    }

    // Fix trailing commas in arrays and objects
    result = result.replace(/,(\s*?[\]}])/g, "$1")

    // Fix missing quotes around string values
    result = result.replace(/:\s*([a-zA-Z][a-zA-Z0-9_\s-]*[a-zA-Z0-9])(\s*[,}])/g, ':"$1"$2')

    // Handle truncated JSON by checking if it's valid
    try {
      JSON.parse(result)
      return result
    } catch (e) {
      // If still invalid, try a more aggressive approach
      console.log("First repair attempt failed, trying more aggressive repair...")

      // If JSON is truncated, try to extract a valid subset
      const validSubsetMatch = result.match(/(\{[\s\S]*\})/g)
      if (validSubsetMatch && validSubsetMatch[0]) {
        try {
          JSON.parse(validSubsetMatch[0])
          return validSubsetMatch[0]
        } catch (e) {
          // Continue with other repair attempts
        }
      }

      // If we have a partial JSON object, try to complete it
      if (result.includes("{") && !result.endsWith("}")) {
        result += "}"
      }

      return result
    }
  } catch (error) {
    console.error("Error in repairJson:", error)
    return jsonString // Return original if repair fails catastrophically
  }
}

/**
 * Safely parse JSON with error handling and repair attempts
 * @param jsonString JSON string to parse
 * @returns Parsed JSON object or null if parsing fails
 */
function safeJsonParse(jsonString: string): any {
  try {
    // First try direct parsing
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn("Initial JSON parse failed, attempting to repair JSON:", error)

    try {
      // Try to repair and parse
      const repairedJson = repairJson(jsonString)

      try {
        return JSON.parse(repairedJson)
      } catch (parseError) {
        console.error("Failed to parse repaired JSON, attempting fallback parsing")

        // If we still can't parse, try to extract a valid JSON object
        const jsonObjectMatch = repairedJson.match(/\{[\s\S]*?\}/g)
        if (jsonObjectMatch && jsonObjectMatch[0]) {
          return JSON.parse(jsonObjectMatch[0])
        }

        throw parseError
      }
    } catch (repairError) {
      console.error("Failed to parse even after repair attempt:", repairError)
      console.error("Original JSON string:", jsonString.substring(0, 500) + "...")
      console.error("Repaired JSON string:", repairJson(jsonString).substring(0, 500) + "...")

      // Return a default structure as fallback
      return {
        title: "Generated Website",
        description: "A website generated with AI",
        targetAudience: "General users",
        pages: [
          {
            id: "home",
            name: "Home",
            sections: [
              {
                id: "hero",
                name: "Hero",
                purpose: "Main banner",
                content: "Welcome to our website",
                hasImage: true,
                imageDescription: "Hero image",
              },
              {
                id: "content",
                name: "Content",
                purpose: "Main content",
                content: "Website content goes here",
                hasImage: false,
              },
            ],
          },
          {
            id: "about",
            name: "About",
            sections: [
              {
                id: "about-content",
                name: "About Content",
                purpose: "About information",
                content: "About us content goes here",
                hasImage: true,
                imageDescription: "Team image",
              },
            ],
          },
        ],
        colorScheme: {
          primary: "#3b82f6",
          secondary: "#10b981",
          accent: "#f59e0b",
          background: "#ffffff",
          text: "#111827",
        },
        typography: {
          headingFont: "system-ui",
          bodyFont: "system-ui",
        },
        features: ["Responsive design", "Interactive modals", "Multi-page structure"],
        layout: "grid",
        interactiveElements: ["Modals", "Expandable content viewers"],
      }
    }
  }
}

/**
 * Detect if a text chunk is a thinking process
 * @param text Text chunk to analyze
 * @returns Boolean indicating if the text is thinking
 */
function isThinkingChunk(text: string): boolean {
  const thinkingPatterns = [
    "Let me think",
    "I'll analyze",
    "First, I need to",
    "Step 1:",
    "Let's break this down",
    "I should consider",
    "To approach this",
    "Let me start by",
    "I'll begin by",
    "To solve this",
    "Let's think about",
    "I need to understand",
  ]

  return thinkingPatterns.some((pattern) => text.includes(pattern))
}

/**
 * Detect if a text chunk contains code
 * @param text Text chunk to analyze
 * @returns Object with code type and boolean indicating if the text contains code
 */
function detectCodeChunk(text: string): { isCode: boolean; type: string | null } {
  // Check for code block markers
  if (text.includes("```html") || text.includes("<html") || text.includes("<!DOCTYPE")) {
    return { isCode: true, type: "html" }
  }
  if (text.includes("```css") || text.includes("@media") || text.includes("body {")) {
    return { isCode: true, type: "css" }
  }
  if (text.includes("```javascript") || text.includes("function") || text.includes("const ")) {
    return { isCode: true, type: "javascript" }
  }
  if (text.includes("```json") || (text.includes("{") && text.includes("}"))) {
    return { isCode: true, type: "json" }
  }

  return { isCode: false, type: null }
}

/**
 * Generate content with thinking capabilities and streaming
 * @param prompt The prompt to send to Gemini
 * @param onThinking Callback function to receive thinking updates
 * @param onCodeGeneration Callback function to receive code generation updates
 * @param onProgress Callback function to receive progress updates
 * @returns The final generated content
 */
export async function generateWithThinking(
  prompt: string,
  onThinking?: (thinking: string) => void,
  onCodeGeneration?: (codeType: string, code: string) => void,
  onProgress?: (status: string) => void,
): Promise<string> {
  try {
    const ai = getGeminiClient()

    // Use the thinking-enabled model with streaming
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-pro-preview-03-25", // or "gemini-2.0-flash-thinking-exp"
      contents: prompt,
    })

    let fullContent = ""
    let thinkingContent = ""
    let currentCodeBlock = { type: "", content: "" }
    let inCodeBlock = false

    // Process the streaming response
    for await (const chunk of stream) {
      if (chunk.text) {
        // Add to full content
        fullContent += chunk.text

        // Check if this chunk is thinking or code
        const isThinking = isThinkingChunk(chunk.text)
        const codeDetection = detectCodeChunk(chunk.text)

        // Handle thinking content
        if (isThinking) {
          thinkingContent += chunk.text
          if (onThinking) onThinking(thinkingContent)

          // Also send a status update for thinking
          if (onProgress) {
            const shortThinking = chunk.text.split(".")[0] // Just the first sentence
            onProgress(`Thinking: ${shortThinking}...`)
          }
        }
        // Handle code blocks
        else if (codeDetection.isCode) {
          // Check if we're starting a new code block
          if (chunk.text.includes("```") && !inCodeBlock) {
            inCodeBlock = true
            currentCodeBlock.type = codeDetection.type || ""
            currentCodeBlock.content = chunk.text
          }
          // Add to existing code block
          else if (inCodeBlock) {
            currentCodeBlock.content += chunk.text

            // Check if code block is ending
            if (chunk.text.includes("```") && inCodeBlock) {
              inCodeBlock = false
              if (onCodeGeneration && currentCodeBlock.type) {
                onCodeGeneration(currentCodeBlock.type, currentCodeBlock.content)
              }
              currentCodeBlock = { type: "", content: "" }
            }
          }

          // Send progress update for code generation
          if (onProgress && codeDetection.type) {
            onProgress(`Generating ${codeDetection.type} code...`)
          }
        }
        // Regular content
        else if (onProgress && chunk.text.trim().length > 10) {
          onProgress(`Generating: ${chunk.text.substring(0, 40)}...`)
        }
      }
    }

    return fullContent
  } catch (error) {
    console.error("Error in generateWithThinking:", error)
    throw error
  }
}

/**
 * Generate website code with thinking capabilities and streaming
 * @param prompt The website description prompt
 * @param onThinking Callback function to receive thinking updates
 * @param onCodeGeneration Callback function to receive code generation updates
 * @param onProgress Callback function to receive progress updates
 * @returns The generated HTML, CSS, and JS
 */
export async function generateWebsiteWithThinking(
  prompt: string,
  onThinking?: (thinking: string) => void,
  onCodeGeneration?: (codeType: string, code: string) => void,
  onProgress?: (status: string) => void,
): Promise<{ html: string; css: string; js: string }> {
  try {
    if (onProgress) onProgress("Starting website generation with thinking...")

    const enhancedPrompt = `
   Create a responsive, interactive website for: ${prompt}
   
   Think step by step about:
   1. The overall structure and sections needed
   2. The design style and color scheme that would work best
   3. What interactive elements would enhance user experience
   4. How to make it responsive for all devices
   5. What images or media would be appropriate
   
   IMPORTANT REQUIREMENTS:
   1. Create a multi-page structure with AT LEAST 3 PAGES (Home, About, and at least one more page)
   2. Implement a grid layout to display multiple content viewers/cards
   3. Make each content viewer expandable - clicking should open a full-sized popup modal
   4. Add popup modals for ALL buttons in the website
   5. Ensure all interactive elements have smooth animations
   6. INCLUDE A DARK/LIGHT MODE TOGGLE that changes the color scheme of the entire website
   
   Generate clean, semantic HTML5, modern CSS3, and advanced JavaScript. 
   Use placeholder images with unique IDs like <img id="img-placeholder-hero" src="/placeholder.svg?width=800&height=400" alt="Hero Image">.
   
   Important: For ALL images, use descriptive IDs that start with "img-" followed by a purpose (e.g., "img-hero", "img-product-1", "img-team", etc.)
   and include meaningful alt text that describes what the image should contain.
   
   For the dark/light mode toggle:
   1. Create a toggle button in the header/navigation area
   2. Use CSS variables for colors that change between dark and light modes
   3. Store the user's preference in localStorage
   4. Add smooth transitions when switching between modes
   
   Return ONLY the code in this format:
   
   \`\`\`html
   <!DOCTYPE html>
   <html>
   <!-- Complete HTML code here with multi-page structure -->
   </html>
   \`\`\`
   
   \`\`\`css
   /* Complete CSS code here with grid layouts, modal styling, and dark/light mode variables */
   \`\`\`
   
   \`\`\`javascript
   // Complete JavaScript code here with modal functionality, page navigation, and dark/light mode toggle
   \`\`\`
   `

    let currentThinking = ""
    let generatedContent = ""
    let htmlCode = ""
    let cssCode = ""
    let jsCode = ""

    // Use the streaming thinking generation
    const fullContent = await generateWithThinking(
      enhancedPrompt,
      (thinking) => {
        // Accumulate thinking updates
        currentThinking += thinking
        if (onThinking) onThinking(currentThinking)
      },
      (codeType, code) => {
        // Process code based on type
        const cleanCode = code
          .replace(/```\w+\s*/, "")
          .replace(/```\s*$/, "")
          .trim()

        if (codeType === "html") {
          htmlCode = cleanCode
          if (onCodeGeneration) onCodeGeneration("html", htmlCode)
        } else if (codeType === "css") {
          cssCode = cleanCode
          if (onCodeGeneration) onCodeGeneration("css", cssCode)
        } else if (codeType === "javascript") {
          jsCode = cleanCode
          if (onCodeGeneration) onCodeGeneration("javascript", jsCode)
        }

        // Add to generated content
        generatedContent += code
      },
      (status) => {
        // Pass through progress updates
        if (onProgress) onProgress(status)
      },
    )

    // If we didn't get code blocks through streaming, extract them from the full content
    if (!htmlCode) {
      const htmlMatch = fullContent.match(/```html\s*([\s\S]*?)\s*```/)
      htmlCode = htmlMatch ? htmlMatch[1].trim() : "<!-- HTML generation failed -->"
    }

    if (!cssCode) {
      const cssMatch = fullContent.match(/```css\s*([\s\S]*?)\s*```/)
      cssCode = cssMatch ? cssMatch[1].trim() : "/* CSS generation failed */"
    }

    if (!jsCode) {
      const jsMatch = fullContent.match(/```javascript\s*([\s\S]*?)\s*```/)
      jsCode = jsMatch ? jsMatch[1].trim() : "// JavaScript generation failed"
    }

    if (onProgress) onProgress("Website code generation complete!")

    return { html: htmlCode, css: cssCode, js: jsCode }
  } catch (error) {
    console.error("Error in generateWebsiteWithThinking:", error)
    throw error
  }
}

/**
 * Generate website with multi-step thinking and chat capabilities
 * @param prompt The website description prompt
 * @param onThinking Callback function to receive thinking updates
 * @param onCodeGeneration Callback function to receive code generation updates
 * @param onProgress Callback function to receive progress updates
 * @returns The generated website data
 */
export async function generateAdvancedWebsiteWithThinking(
  prompt: string,
  onThinking?: (thinking: string) => void,
  onCodeGeneration?: (codeType: string, code: string) => void,
  onProgress?: (status: string) => void,
): Promise<{
  plan: any
  html: string
  css: string
  js: string
  interactiveElements: string[]
}> {
  try {
    if (onProgress) onProgress("Starting advanced website generation with thinking...")

    // Step 1: Create a chat session for multi-turn conversation
    const ai = getGeminiClient()
    const chat = ai.chats.create({
      model: "gemini-2.5-pro-preview-03-25", // or "gemini-2.0-flash-thinking-exp"
    })

    // Step 2: Generate website plan with thinking
    if (onProgress) onProgress("Planning website structure and features...")
    if (onThinking) onThinking("Thinking about the website plan...")

    const planPrompt = `
   Create a detailed website plan for: "${prompt}"
   
   Think step by step about:
   1. The target audience and their needs
   2. The key sections needed for this type of website
   3. The visual style and branding elements
   4. The interactive features that would enhance user experience
   
   IMPORTANT REQUIREMENTS:
   1. Design a multi-page structure with AT LEAST 3 DISTINCT PAGES (must include Home, About, and at least one more page)
   2. Include a grid layout for displaying content cards/viewers
   3. Plan for expandable content viewers that open as modal popups
   4. Include popup modals for all interactive buttons
   5. Ensure a cohesive design across all pages
   6. INCLUDE A DARK/LIGHT MODE TOGGLE feature
   
   Return a valid JSON object with the following structure:
   {
     "title": "Website title",
     "description": "Brief description of the website",
     "targetAudience": "Who the website is for",
     "pages": [
       {
         "id": "page-id",
         "name": "Page name (e.g., Home, About, Services)",
         "sections": [
           {
             "id": "section-id",
             "name": "Section name",
             "purpose": "What this section accomplishes",
             "content": "Brief description of content",
             "hasImage": true,
             "imageDescription": "Detailed description for image generation (if hasImage is true)",
             "hasModal": true,
             "modalContent": "Content to display in the modal popup (if hasModal is true)"
           }
         ]
       }
     ],
     "colorScheme": {
       "primary": "#hex color",
       "secondary": "#hex color",
       "accent": "#hex color",
       "background": "#hex color",
       "text": "#hex color",
       "darkBackground": "#hex color for dark mode",
       "darkText": "#hex color for dark mode text"
     },
     "typography": {
       "headingFont": "font name",
       "bodyFont": "font name"
     },
     "features": ["feature1", "feature2", "Dark/Light Mode Toggle"],
     "layout": "layout style (grid, multi-column, etc.)",
     "interactiveElements": ["Modals", "Expandable content", "Navigation", "Dark/Light Mode Toggle"]
   }
   
   IMPORTANT: Ensure all property names are in double quotes and all string values are in double quotes. Do not use single quotes or unquoted property names.
   `

    // Use streaming for the plan generation
    const planStream = await chat.sendMessageStream({
      message: planPrompt,
    })

    let planThinking = ""
    let planText = ""
    let jsonContent = ""
    let inJsonBlock = false

    for await (const chunk of planStream) {
      if (chunk.text) {
        // Check if this is thinking or JSON content
        const isThinking = isThinkingChunk(chunk.text)

        if (isThinking) {
          planThinking += chunk.text
          if (onThinking) onThinking(planThinking)
          if (onProgress) onProgress(`Thinking: ${chunk.text.substring(0, 40)}...`)
        } else {
          planText += chunk.text

          // Check for JSON block markers
          if (chunk.text.includes("```json") && !inJsonBlock) {
            inJsonBlock = true
            jsonContent = chunk.text
          } else if (inJsonBlock) {
            jsonContent += chunk.text

            // Check if JSON block is ending
            if (chunk.text.includes("```") && inJsonBlock) {
              inJsonBlock = false
              if (onCodeGeneration) onCodeGeneration("json", jsonContent)
            }
          }

          if (onProgress && !isThinking) onProgress("Generating website plan...")
        }
      }
    }

    // Extract JSON from the plan text
    const planMatch = planText.match(/```json\s*([\s\S]*?)\s*```/) || planText.match(/\{[\s\S]*\}/)
    if (!planMatch) {
      throw new Error("Failed to extract plan JSON from response")
    }

    let plan
    try {
      // Use our safe JSON parser with repair capabilities
      const jsonString = planMatch[0].replace(/```json|```/g, "").trim()
      console.log("Attempting to parse plan JSON:", jsonString.substring(0, 200) + "...")
      plan = safeJsonParse(jsonString)

      if (!plan) {
        throw new Error("Failed to parse plan JSON")
      }

      // Validate the plan has the required structure
      if (!plan.title || !plan.pages || !Array.isArray(plan.pages)) {
        console.warn("Plan JSON is missing required fields, using default structure")
        plan = {
          title: "Generated Website",
          description: prompt,
          targetAudience: "General users",
          pages: [
            {
              id: "home",
              name: "Home",
              sections: [
                {
                  id: "hero",
                  name: "Hero",
                  purpose: "Introduce the website",
                  content: prompt,
                  hasImage: true,
                  imageDescription: prompt,
                  hasModal: false,
                },
                {
                  id: "features",
                  name: "Features",
                  purpose: "Showcase features",
                  content: "Features grid",
                  hasImage: true,
                  imageDescription: "Feature images",
                  hasModal: true,
                  modalContent: "Detailed feature information",
                },
              ],
            },
            {
              id: "about",
              name: "About",
              sections: [
                {
                  id: "about-content",
                  name: "About Content",
                  purpose: "About information",
                  content: "About us content",
                  hasImage: true,
                  imageDescription: "Team image",
                  hasModal: false,
                },
              ],
            },
            {
              id: "contact",
              name: "Contact",
              sections: [
                {
                  id: "contact-form",
                  name: "Contact Form",
                  purpose: "Contact information",
                  content: "Contact form",
                  hasImage: false,
                  hasModal: true,
                  modalContent: "Form submission confirmation",
                },
              ],
            },
          ],
          colorScheme: {
            primary: "#3b82f6",
            secondary: "#10b981",
            accent: "#f59e0b",
            background: "#ffffff",
            text: "#111827",
          },
          typography: {
            headingFont: "system-ui",
            bodyFont: "system-ui",
          },
          features: ["Responsive design", "Interactive modals", "Multi-page structure"],
          layout: "grid",
          interactiveElements: ["Modals", "Expandable content viewers", "Navigation"],
        }
      }
    } catch (e) {
      console.error("Error parsing plan JSON:", e)
      console.error("Raw plan text:", planText.substring(0, 1000))
      throw new Error(`Failed to parse plan JSON: ${e.message}`)
    }

    if (onProgress) onProgress("Website plan created successfully!")

    // Step 3: Generate HTML, CSS, and JS based on the plan
    if (onProgress) onProgress("Generating website code based on the plan...")
    if (onThinking) onThinking("Thinking about how to implement the website based on the plan...")

    const codePrompt = `
   Generate a complete, modern, and responsive website based on this plan:
   
   ${JSON.stringify(plan, null, 2)}
   
   Think step by step about:
   1. How to structure the HTML to implement the multi-page design with at least 3 pages
   2. How to create a grid layout for content viewers
   3. How to implement popup modals for all buttons
   4. How to make content viewers expandable to full-sized popups
   5. How to implement smooth transitions and animations
   6. How to implement a dark/light mode toggle with proper color scheme changes
   
   Create a sophisticated website with these requirements:
   1. Use semantic HTML5 with proper structure
   2. Create modern, responsive CSS using flexbox and grid
   3. Implement a multi-page structure with AT LEAST 3 PAGES (Home, About, and at least one more)
   4. Create a grid layout for content viewers/cards
   5. Make each content viewer expandable to a full-sized popup
   6. Add popup modals for ALL buttons
   7. Implement the color scheme and typography from the plan
   8. For images, use placeholder images with unique IDs like <img id="img-hero" src="/placeholder.svg?width=800&height=400" alt="Hero Image">
   9. Make sure all images have descriptive IDs that start with "img-" and include meaningful alt text
   10. Add animations and transitions for a polished feel
   11. Ensure the website is fully responsive for mobile, tablet, and desktop
   12. IMPLEMENT A DARK/LIGHT MODE TOGGLE that:
       - Is visible in the header/navigation area
       - Uses CSS variables for colors that change between modes
       - Stores the user's preference in localStorage
       - Adds smooth transitions when switching between modes
   
   Return ONLY the code in this format:
   
   \`\`\`html
   <!DOCTYPE html>
   <html>
   <!-- Complete HTML code here -->
   </html>
   \`\`\`
   
   \`\`\`css
   /* Complete CSS code here */
   \`\`\`
   
   \`\`\`javascript
   // Complete JavaScript code here
   \`\`\`
   
   \`\`\`json
   ["list", "of", "interactive", "elements", "added"]
   \`\`\`
   `

    // Use streaming for the code generation
    const codeStream = await chat.sendMessageStream({
      message: codePrompt,
    })

    let codeThinking = ""
    let codeText = ""
    let htmlCode = ""
    let cssCode = ""
    let jsCode = ""
    let elementsJson = ""
    let currentCodeType = ""

    for await (const chunk of codeStream) {
      if (chunk.text) {
        // Check if this is thinking or code content
        const isThinking = isThinkingChunk(chunk.text)

        if (isThinking) {
          codeThinking += chunk.text
          if (onThinking) onThinking(codeThinking)
          if (onProgress) onProgress(`Thinking: ${chunk.text.substring(0, 40)}...`)
        } else {
          codeText += chunk.text

          // Check for code block markers
          if (chunk.text.includes("```html")) {
            currentCodeType = "html"
            if (onProgress) onProgress("Generating HTML code...")
          } else if (chunk.text.includes("```css")) {
            currentCodeType = "css"
            if (onProgress) onProgress("Generating CSS code...")
          } else if (chunk.text.includes("```javascript")) {
            currentCodeType = "javascript"
            if (onProgress) onProgress("Generating JavaScript code...")
          } else if (chunk.text.includes("```json")) {
            currentCodeType = "json"
            if (onProgress) onProgress("Generating interactive elements list...")
          }

          // Add content to the appropriate code block
          if (currentCodeType === "html") {
            htmlCode += chunk.text
            if (onCodeGeneration) onCodeGeneration("html", htmlCode)
          } else if (currentCodeType === "css") {
            cssCode += chunk.text
            if (onCodeGeneration) onCodeGeneration("css", cssCode)
          } else if (currentCodeType === "javascript") {
            jsCode += chunk.text
            if (onCodeGeneration) onCodeGeneration("javascript", jsCode)
          } else if (currentCodeType === "json") {
            elementsJson += chunk.text
            if (onCodeGeneration) onCodeGeneration("json", elementsJson)
          }

          // Check for end of code block
          if (chunk.text.includes("```") && currentCodeType) {
            currentCodeType = ""
          }
        }
      }
    }

    // Extract code blocks
    const htmlMatch = codeText.match(/```html\s*([\s\S]*?)\s*```/)
    const cssMatch = codeText.match(/```css\s*([\s\S]*?)\s*```/)
    const jsMatch = codeText.match(/```javascript\s*([\s\S]*?)\s*```/)
    const elementsMatch = codeText.match(/```json\s*([\s\S]*?)\s*```/)

    if (!htmlMatch) {
      throw new Error("Failed to extract HTML from response")
    }

    const html = htmlMatch ? htmlMatch[1].trim() : "<!-- HTML generation failed -->"
    const css = cssMatch ? cssMatch[1].trim() : "/* CSS generation failed */"
    const js = jsMatch ? jsMatch[1].trim() : "// JavaScript generation failed"

    // Extract interactive elements
    let interactiveElements: string[] = []
    if (elementsMatch) {
      try {
        interactiveElements = safeJsonParse(elementsMatch[1].trim())
        if (!Array.isArray(interactiveElements)) {
          interactiveElements = ["Modals", "Expandable content viewers", "Navigation", "Interactive buttons"]
        }
      } catch (e) {
        console.warn("Failed to parse interactive elements JSON")
        interactiveElements = ["Modals", "Expandable content viewers", "Navigation", "Interactive buttons"]
      }
    } else {
      interactiveElements = ["Modals", "Expandable content viewers", "Navigation", "Interactive buttons"]
    }

    if (onProgress) onProgress("Website code generation complete!")

    return {
      plan,
      html,
      css,
      js,
      interactiveElements,
    }
  } catch (error) {
    console.error("Error in generateAdvancedWebsiteWithThinking:", error)
    throw error
  }
}
