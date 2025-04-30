"use server"

import { GoogleGenAI } from "@google/genai"

// Update the ProductInfo interface to include color
interface ProductInfo {
  id: string
  name: string
  imageUrl: string
  type: "clothing" | "decor" | "other"
  color?: {
    hex: string
    name: string
  }
}

interface VisualizeProductRequest {
  products: ProductInfo[]
  userImage?: string
}

interface VisualizeProductResponse {
  visualizationUrl: string
  error?: string
}

// Update the visualizeProduct function to include color information in the prompt
export async function visualizeProduct(request: VisualizeProductRequest): Promise<VisualizeProductResponse> {
  try {
    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set")
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenAI({ apiKey })

    // Prepare the content parts
    const contentParts: any[] = []

    // Create the appropriate prompt based on products and whether user image is provided
    let prompt = ""

    // Determine the dominant product type
    const productTypes = request.products.map((p) => p.type)
    const isMainlyClothing = productTypes.filter((t) => t === "clothing").length > productTypes.length / 2
    const isMainlyDecor = productTypes.filter((t) => t === "decor").length > productTypes.length / 2

    // Create product names list with color information
    const productDescriptions = request.products
      .map((p) => {
        if (p.color) {
          return `${p.name} in ${p.color.name} color (hex: ${p.color.hex})`
        }
        return p.name
      })
      .join(", ")

    if (isMainlyClothing) {
      prompt = request.userImage
        ? `Create a realistic visualization of a person in this photo wearing these items together: ${productDescriptions}. If a color is specified for any item, please change the item to that color.`
        : `Create a realistic visualization of a person wearing these items together: ${productDescriptions}. If a color is specified for any item, please change the item to that color.`
    } else if (isMainlyDecor) {
      prompt = request.userImage
        ? `Create a realistic visualization of these items placed together in this room, replace the main similar furniture/decor subject/item. If multiple objects, make sense of it's purpose and context: ${productDescriptions}. If a color is specified for any item, please change the item to that color.`
        : `Create a realistic visualization of these items arranged together in a stylish room setting, replace the main similar subject/decor item. If multiple objects, place them in reasonable ways that make sense to it's purpose and the context: ${productDescriptions}. If a color is specified for any item, please change the item to that color.`
    } else {
      prompt = request.userImage
        ? `Create a realistic visualization of these items being used together with the reference image: ${productDescriptions}. If a color is specified for any item, please change the item to that color.`
        : `Create a realistic visualization of these items being used together in an appropriate context: ${productDescriptions}. If a color is specified for any item, please change the item to that color.`
    }

    // Add the prompt to content parts
    contentParts.push({ text: prompt })

    // Add all product images to content parts
    for (const product of request.products) {
      if (product.imageUrl) {
        // For URLs, fetch the image and convert to base64
        const response = await fetch(product.imageUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch product image: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64Data = buffer.toString("base64")
        const mimeType = response.headers.get("content-type") || "image/jpeg"

        contentParts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        })
      }
    }

    // Add the user image to content parts if provided
    if (request.userImage) {
      // Extract base64 data if it's a data URI
      if (request.userImage.startsWith("data:image")) {
        const matches = request.userImage.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
        if (matches && matches.length === 3) {
          const mimeType = matches[1]
          const base64Data = matches[2]
          contentParts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          })
        } else {
          throw new Error("Invalid user image data URI format")
        }
      } else {
        throw new Error("User image must be a data URI")
      }
    }

    // Generate the visualization using the updated API pattern
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: contentParts,
      config: {
        responseModalities: ["Text", "Image"],
      },
    })

    // Extract the generated image from the response
    let generatedImageBase64: string | null = null
    let generatedImageMimeType = "image/png"

    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0]
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            generatedImageBase64 = part.inlineData.data
            generatedImageMimeType = part.inlineData.mimeType || generatedImageMimeType
            break
          }
        }
      }
    }

    if (!generatedImageBase64) {
      throw new Error("No image was generated in the response")
    }

    // Create a data URI from the base64 data
    const dataUri = `data:${generatedImageMimeType};base64,${generatedImageBase64}`

    return {
      visualizationUrl: dataUri,
    }
  } catch (error) {
    console.error("Error in visualizeProduct:", error)
    return {
      visualizationUrl: "/placeholder.svg?height=400&width=400&text=Visualization+Failed",
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
