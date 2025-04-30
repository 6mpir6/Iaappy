"use server"

import { GoogleGenAI } from "@google/genai"

// Interfaces
export interface ImageGenerationRequest {
  prompt: string
  width?: number
  height?: number
  style?: string
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4"
  count?: number // Add count parameter for bulk generation
}

export interface ImageGenerationResponse {
  url: string
  base64Data?: string
}

export interface BulkImageGenerationResponse {
  images: Array<{
    url: string
    id: string
    base64Data?: string
  }>
}

export interface ImageEditRequest {
  imageUrl: string
  prompt: string
  isExternalUrl?: boolean // Add this flag to indicate if the URL is external
}

// Helper to get API Client
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY environment variable is not set.")
    throw new Error("Server configuration error: Missing Gemini API Key.")
  }
  return new GoogleGenAI({ apiKey })
}

/**
 * Generates an image using Gemini's image generation capabilities.
 * @param request Image generation request parameters
 * @returns Object containing the Base64 Data URI of the generated image or a placeholder on error
 */
export async function generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  console.log(`Initiating Gemini image generation for prompt: "${request.prompt.substring(0, 100)}..."`)
  try {
    // Get API key and initialize the client
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY environment variable is not set.")
      throw new Error("Server configuration error: Missing Gemini API Key.")
    }

    // Explicitly create a new instance of GoogleGenAI
    const genAI = new GoogleGenAI({ apiKey })

    // Use the experimental image generation model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp-image-generation" })

    // Determine aspect ratio
    let aspectRatio = request.aspectRatio || "1:1" // Default to square
    if (!request.aspectRatio && request.width && request.height) {
      const ratio = request.width / request.height
      if (ratio > 1.7) aspectRatio = "16:9"
      else if (ratio > 1.25) aspectRatio = "4:3"
      else if (ratio < 0.6) aspectRatio = "9:16"
      else if (ratio < 0.8) aspectRatio = "3:4"
      console.log(`Calculated aspectRatio: ${aspectRatio} from ${request.width}x${request.height}`)
    }

    const fullPrompt = `${request.prompt}${request.style ? `, style: ${request.style}` : ""}, aspect ratio ${aspectRatio}, high quality, detailed`

    // Generate content with image response modality
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseModalities: ["Text", "Image"], // Required for image generation
      },
    })

    console.log("Gemini API response received.")

    // Extract image data from response
    let base64Data = null
    let mimeType = "image/png"

    if (response.response && response.response.candidates && response.response.candidates.length > 0) {
      const candidate = response.response.candidates[0]
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            base64Data = part.inlineData.data
            mimeType = part.inlineData.mimeType || mimeType
            break
          }
        }
      }
    }

    if (!base64Data) {
      throw new Error("No image data found in Gemini response")
    }

    const dataUrl = `data:${mimeType};base64,${base64Data}`
    console.log("Gemini image generated successfully. Returning Data URL.")
    return { url: dataUrl, base64Data }
  } catch (error: unknown) {
    console.error("Error in generateImage function:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const placeholderHeight = request.height || 400
    const placeholderWidth = request.width || 400
    const placeholderUrl = `/placeholder.svg?height=${placeholderHeight}&width=${placeholderWidth}&text=ImgGenErr`
    console.warn(`Returning placeholder image URL due to error: ${placeholderUrl}`)
    return { url: placeholderUrl }
  }
}

/**
 * Generates multiple images in bulk using Gemini's image generation capabilities.
 * @param request Image generation request parameters
 * @returns Object containing an array of generated images as Base64 Data URIs
 */
export async function generateBulkImages(request: ImageGenerationRequest): Promise<BulkImageGenerationResponse> {
  console.log(`Initiating bulk Gemini image generation for prompt: "${request.prompt.substring(0, 100)}..."`)

  const count = request.count || 4 // Default to 4 images if count not specified
  const images: Array<{ url: string; id: string; base64Data?: string }> = []

  try {
    // Generate images in parallel
    const promises = Array(count)
      .fill(0)
      .map(async (_, index) => {
        try {
          // Add slight variation to each prompt to get different results
          const promptVariation = index === 0 ? request.prompt : `${request.prompt} (variation ${index + 1})`

          const result = await generateImage({
            ...request,
            prompt: promptVariation,
          })

          return {
            url: result.url,
            id: `gemini-${Date.now()}-${index}`,
            base64Data: result.base64Data,
          }
        } catch (error) {
          console.error(`Error generating image ${index + 1}:`, error)
          return {
            url: `/placeholder.svg?height=400&width=400&text=Image+${index + 1}+Error`,
            id: `error-${Date.now()}-${index}`,
          }
        }
      })

    const results = await Promise.all(promises)
    images.push(...results)

    console.log(`Successfully generated ${images.length} images with Gemini`)
    return { images }
  } catch (error) {
    console.error("Error in bulk image generation:", error)

    // Return placeholder images if bulk generation fails
    for (let i = 0; i < count; i++) {
      images.push({
        url: `/placeholder.svg?height=400&width=400&text=Bulk+Gen+Error+${i + 1}`,
        id: `error-${Date.now()}-${i}`,
      })
    }

    return { images }
  }
}

// Handle image editing
export async function editImage(request: ImageEditRequest): Promise<ImageGenerationResponse> {
  try {
    let base64Data: string
    let mimeType: string

    // Handle different image sources
    if (request.isExternalUrl) {
      // Handle external URL on the server side to avoid CORS issues
      try {
        console.log("Fetching external image URL on server side:", request.imageUrl.substring(0, 100))
        const response = await fetch(request.imageUrl)

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
        }

        // Get the mime type from the response
        mimeType = response.headers.get("content-type") || "image/jpeg"

        // Convert to buffer and then to base64
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        base64Data = buffer.toString("base64")

        console.log("Successfully converted external image to base64")
      } catch (fetchError) {
        console.error("Error fetching external image:", fetchError)
        throw new Error(`Failed to fetch external image: ${fetchError.message}`)
      }
    } else if (request.imageUrl.startsWith("data:image/")) {
      // Extract the base64 data and mime type from the Data URI
      const parts = request.imageUrl.split(",")
      if (parts.length !== 2) {
        throw new Error("Invalid Data URI format.")
      }

      const mimeMatch = parts[0].match(/^data:(image\/\w+);base64$/)
      if (!mimeMatch || !mimeMatch[1]) {
        throw new Error("Could not determine mime type from image Data URI.")
      }
      mimeType = mimeMatch[1]
      base64Data = parts[1]
    } else {
      throw new Error("Invalid imageUrl format. Expected Base64 Data URI or external URL with isExternalUrl flag.")
    }

    // Get API key and initialize the client
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY environment variable is not set.")
      throw new Error("Server configuration error: Missing Gemini API Key.")
    }

    // Create a new instance of GoogleGenAI
    const ai = new GoogleGenAI({ apiKey })

    // Prepare the content parts according to the API reference
    const contents = [
      { text: request.prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
    ]

    // Call the API with the correct structure
    console.log("Calling Gemini for image editing...")

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: contents,
      config: {
        responseModalities: ["Text", "Image"],
      },
    })

    console.log("Gemini image edit response received.")

    // Extract image data from response
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
      throw new Error(`No edited image found in response. Text: ${textResponse || "(no text)"}`)
    }

    const resultDataUrl = `data:${resultMimeType};base64,${resultBase64Data}`
    console.log(`Image edited successfully.`)
    return { url: resultDataUrl, base64Data: resultBase64Data }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : `Unknown error during edit`
    console.error("Error encountered in editImage function:", error)
    const errorPlaceholderUrl = `/placeholder.svg?height=400&width=400&text=ImgEditErr`
    console.warn(`Returning placeholder image URL due to error in editImage: ${errorPlaceholderUrl}`)
    return { url: errorPlaceholderUrl }
  }
}
