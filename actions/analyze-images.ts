"use server"

import { GoogleGenAI } from "@google/genai"

interface AnalyzeImagesRequest {
  images: string[] // Array of base64-encoded images
}

interface AnalyzeImagesResponse {
  analysis: string
  suggestedPrompts: string[]
  error?: string
}

/**
 * Analyzes multiple images using Gemini to provide insights and suggested prompts
 * @param request Object containing array of base64-encoded images
 * @returns Analysis and suggested prompts
 */
export async function analyzeImages(request: AnalyzeImagesRequest): Promise<AnalyzeImagesResponse> {
  try {
    // Check if we have images to analyze
    if (!request.images || request.images.length === 0) {
      throw new Error("No images provided for analysis")
    }

    // Check if we have at least 2 images for comparison
    const isMultipleImages = request.images.length > 1

    // Get API key and initialize the client
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("CRITICAL: GEMINI_API_KEY environment variable is not set.")
      throw new Error("Server configuration error: Missing Gemini API Key.")
    }

    const genAI = new GoogleGenAI({ apiKey })
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    // Prepare the content parts
    const contentParts: any[] = []

    // Add a prompt based on the number of images
    let prompt = ""
    if (isMultipleImages) {
      prompt = `Analyze these ${request.images.length} images and provide:
1. A brief description of each image
2. Potential relationships between the images (if any)
3. 3-5 creative image editing prompts that could combine or transform these images in interesting ways
4. If one image appears to be a person and another appears to be clothing, suggest prompts for virtual try-on scenarios

Keep your analysis concise but insightful. For the suggested prompts, be specific and creative.`
    } else {
      prompt = `Analyze this image and provide:
1. A brief description of what's in the image
2. 3-5 creative image editing prompts that could enhance or transform this image
3. If this appears to be clothing or a person, suggest prompts that would work well for fashion-related edits

Keep your analysis concise but insightful. For the suggested prompts, be specific and creative.`
    }

    contentParts.push({ text: prompt })

    // Add each image to the content parts
    for (const imageBase64 of request.images) {
      // Extract the base64 data and mime type
      const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        throw new Error("Invalid base64 image format")
      }

      const mimeType = matches[1]
      const base64Data = matches[2]

      contentParts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      })
    }

    // Generate content with the model
    const result = await model.generateContent(contentParts)
    const responseText = result.response.text()

    // Extract suggested prompts from the response
    const promptRegex = /(?:prompt|suggestion)s?:?\s*(?:\d+\.\s*)?(.*?)(?=\d+\.|$)/gi
    const matches = responseText.matchAll(promptRegex)
    const suggestedPrompts: string[] = []

    for (const match of matches) {
      if (match[1] && match[1].trim()) {
        suggestedPrompts.push(match[1].trim())
      }
    }

    // If we couldn't extract prompts, create some default ones
    if (suggestedPrompts.length === 0) {
      // Try to find any sentences that might be prompts
      const sentences = responseText.split(/[.!?]/).filter((s) => s.trim().length > 10 && s.trim().length < 100)
      for (let i = 0; i < Math.min(sentences.length, 3); i++) {
        suggestedPrompts.push(sentences[i].trim())
      }

      // If still no prompts, add some defaults
      if (suggestedPrompts.length === 0) {
        suggestedPrompts.push("Enhance the colors and contrast")
        suggestedPrompts.push("Transform into a professional studio photo")
        suggestedPrompts.push("Add a creative artistic filter")
      }
    }

    return {
      analysis: responseText,
      suggestedPrompts: suggestedPrompts.slice(0, 5), // Limit to 5 prompts
    }
  } catch (error) {
    console.error("Error analyzing images:", error)
    return {
      analysis: "Failed to analyze the images. Please try again.",
      suggestedPrompts: ["Enhance the image", "Add artistic effects", "Improve lighting and contrast"],
      error: error instanceof Error ? error.message : "Unknown error during image analysis",
    }
  }
}
