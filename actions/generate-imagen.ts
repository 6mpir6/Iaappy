"use server"

import { GoogleGenAI } from "@google/genai"

interface ImagenGenerationRequest {
  prompt: string
  numberOfImages?: number
  width?: number
  height?: number
}

interface ImagenGenerationResponse {
  images: Array<{
    url: string // Base64 data URI
    id: string
  }>
}

/**
 * Generates images using Google's Imagen 3 model
 * @param request Image generation request parameters
 * @returns Object containing array of generated images as Base64 data URIs
 */
export async function generateImagenImages(request: ImagenGenerationRequest): Promise<ImagenGenerationResponse> {
  console.log(`Generating images with Imagen 3 for prompt: "${request.prompt}"`)

  try {
    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY environment variable is not set.")
      throw new Error("Server configuration error: Missing Gemini API Key.")
    }

    // Initialize the Google Generative AI client
    const genAI = new GoogleGenAI(apiKey)

    // Use the imagen-3.0-generate-002 model
    const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" })

    // Set up generation parameters
    const numberOfImages = request.numberOfImages || 4

    // Generate images
    const response = await model.generateImages({
      prompt: request.prompt,
      config: {
        numberOfImages: numberOfImages,
      },
    })

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error("No images were generated")
    }

    // Convert the images to Base64 data URIs
    const images = response.generatedImages.map((generatedImage, index) => {
      const imageBytes = generatedImage.image.imageBytes
      const dataUri = `data:image/png;base64,${imageBytes}`
      return {
        url: dataUri,
        id: `imagen-${Date.now()}-${index}`,
      }
    })

    console.log(`Successfully generated ${images.length} images with Imagen 3`)
    return { images }
  } catch (error) {
    console.error("Error generating images with Imagen 3:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    // Return a placeholder image
    return {
      images: [
        {
          url: `/placeholder.svg?height=400&width=400&text=Imagen+Error:+${encodeURIComponent(errorMessage)}`,
          id: `imagen-error-${Date.now()}`,
        },
      ],
    }
  }
}
