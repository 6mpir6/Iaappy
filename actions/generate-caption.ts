"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"

type CaptionRequest = {
  imageDataUri: string
  model?: string
  style?: string
}

type CaptionResponse = {
  success: boolean
  caption?: string
  error?: string
}

export async function generateCaption({
  imageDataUri,
  model = "gemini-pro-vision",
  style = "descriptive",
}: CaptionRequest): Promise<CaptionResponse> {
  try {
    if (!imageDataUri) {
      return { success: false, error: "No image data provided" }
    }

    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("Gemini API key not configured")
      return { success: false, error: "Gemini API key not configured" }
    }

    console.log("Initializing Gemini API with model:", model)

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey)
    const genModel = genAI.getGenerativeModel({ model })

    // Extract base64 data from the data URI
    const base64Data = imageDataUri.split(",")[1]
    if (!base64Data) {
      return { success: false, error: "Invalid image data format" }
    }

    // Determine MIME type from the data URI
    const mimeType = imageDataUri.split(";")[0].split(":")[1] || "image/jpeg"

    // Create the prompt for caption generation
    const promptText =
      style === "social media reel caption"
        ? "Generate a creative, engaging social media caption for this image. Make it concise (under 100 characters) and suitable for a video reel or story."
        : "Describe this image in detail. What do you see?"

    console.log("Sending request to Gemini with prompt:", promptText)

    // Create the image part
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType,
      },
    }

    // Generate content with the image and prompt
    const result = await genModel.generateContent([imagePart, promptText])
    const response = await result.response
    const caption = response.text()

    console.log("Received caption from Gemini:", caption ? caption.substring(0, 50) + "..." : "No caption")

    if (!caption) {
      return { success: false, error: "No caption generated" }
    }

    return { success: true, caption }
  } catch (error) {
    console.error("Error generating caption:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during caption generation",
    }
  }
}
