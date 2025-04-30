"use server"

import { GoogleGenAI } from "@google/genai"

interface EditWithUnsplashRequest {
  unsplashPhotoId: string
  unsplashPhotoUrl: string
  prompt: string
  mode: "edit" | "generate" // 'edit' modifies the image, 'generate' uses it as inspiration
}

interface EditWithUnsplashResponse {
  url: string // Will contain Base64 Data URI or placeholder
}

/**
 * Generate a new image or edit an existing one using Gemini with an Unsplash photo as input
 * @param request Request parameters
 * @returns Object containing the Base64 Data URI of the generated/edited image
 */
export async function editWithUnsplash(request: EditWithUnsplashRequest): Promise<EditWithUnsplashResponse> {
  console.log(`Initiating Gemini ${request.mode} with Unsplash photo for prompt: "${request.prompt}"`)
  try {
    // 1. Get the Unsplash photo as a data URI if it's not already
    let imageDataUri = request.unsplashPhotoUrl
    let fetchedMimeType = "image/jpeg" // Default if fetching

    if (!imageDataUri.startsWith("data:image")) {
      console.log(`Input URL is not a Data URI. Fetching image...`)
      const response = await fetch(request.unsplashPhotoUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch Unsplash image URL (${response.status}): ${response.statusText}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString("base64")
      fetchedMimeType = response.headers.get("content-type") || fetchedMimeType
      imageDataUri = `data:${fetchedMimeType};base64,${base64}`
      console.log(`Successfully fetched and converted image to Data URI (${fetchedMimeType}).`)
    }

    // 2. Extract Base64 Data and MimeType from the Data URI
    const parts = imageDataUri.split(",")
    if (parts.length !== 2) throw new Error("Invalid Data URI format after fetch/check.")

    const mimeMatch = parts[0].match(/^data:(image\/\w+);base64$/)
    if (!mimeMatch || !mimeMatch[1]) {
      throw new Error("Could not determine mime type from final image Data URI.")
    }
    const mimeType = mimeMatch[1]
    const base64Data = parts[1]

    // 3. Prepare prompt based on mode
    let promptForGemini: string
    if (request.mode === "edit") {
      promptForGemini = `Perform the following edit on the provided image: "${request.prompt}". Output only the edited image.`
    } else {
      // 'generate' mode
      promptForGemini = `Use the provided image as inspiration or reference. Generate a new image based on this description: "${request.prompt}". Output only the newly generated image.`
    }

    // 4. Get API key and initialize the client
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY environment variable is not set.")
      throw new Error("Server configuration error: Missing Gemini API Key.")
    }

    // Create a new instance of GoogleGenAI
    const ai = new GoogleGenAI({ apiKey })

    // 5. Prepare the content parts according to the API reference
    const contents = [
      { text: promptForGemini },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
    ]

    // 6. Call the API with the correct structure
    console.log("Calling Gemini for image editing/generation...")

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: contents,
      config: {
        responseModalities: ["Text", "Image"],
        temperature: request.mode === "edit" ? 0.4 : 0.7, // Adjust temperature based on mode
      },
    })

    console.log(`Gemini ${request.mode} response received.`)

    // 7. Extract image data from response
    let resultBase64Data = null
    let resultMimeType = "image/png"

    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0]
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            resultBase64Data = part.inlineData.data
            resultMimeType = part.inlineData.mimeType || resultMimeType
            break
          }
        }
      }
    }

    if (!resultBase64Data) {
      const textResponse = response.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text
      throw new Error(`No resulting image found in response for ${request.mode}. Text: ${textResponse || "(no text)"}`)
    }

    const resultDataUrl = `data:${resultMimeType};base64,${resultBase64Data}`
    console.log(`Image ${request.mode} successful.`)
    return { url: resultDataUrl }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : `Unknown error during ${request.mode}`
    console.error(`Error encountered in ${request.mode} function:`, error)
    const errorPlaceholderUrl = `/placeholder.svg?height=400&width=400&text=${request.mode}Err`
    console.warn(`Returning placeholder image URL due to error in ${request.mode}: ${errorPlaceholderUrl}`)
    return { url: errorPlaceholderUrl }
  }
}
