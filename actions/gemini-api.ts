"use server"

import { GoogleGenAI } from "@google/genai"

interface GeminiImageGenerationRequest {
  prompt: string
}

interface GeminiImageGenerationResponse {
  imageUrl: string
  textResponse?: string
  error?: string
}

/**
 * Generates an image using Google Gemini API
 * @param request Image generation request parameters
 * @returns Object containing the URL of the generated image
 */
export async function generateGeminiImage(
  request: GeminiImageGenerationRequest,
): Promise<GeminiImageGenerationResponse> {
  console.log(`Generating image with Gemini for prompt: "${request.prompt}"`)

  try {
    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY environment variable is not set.")
      throw new Error("Server configuration error: Missing Gemini API Key.")
    }

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenAI(apiKey)

    // Use the gemini-pro-vision model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp-image-generation" })

    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: request.prompt }] }],
      generationConfig: {
        temperature: 0.7,
      },
    })

    // Extract image data from response
    let imageUrl: string | null = null
    let textResponse: string | null = null

    if (result.candidates && result.candidates.length > 0) {
      const candidate = result.candidates[0]
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const mimeType = part.inlineData.mimeType
            const base64Data = part.inlineData.data
            imageUrl = `data:${mimeType};base64,${base64Data}`
            break
          } else if (part.text) {
            textResponse = part.text
          }
        }
      }
    }

    if (!imageUrl) {
      throw new Error("No image was generated")
    }

    console.log("Successfully generated image with Gemini")
    return { imageUrl, textResponse }
  } catch (error: any) {
    console.error("Error generating image with Gemini:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    // Return a placeholder image
    return {
      imageUrl: `/placeholder.svg?height=400&width=400&text=Gemini+Error:+${encodeURIComponent(errorMessage)}`,
      error: errorMessage,
    }
  }
}
