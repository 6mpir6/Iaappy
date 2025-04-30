"use server"

import { GoogleGenAI } from "@google/genai"

// Initialize the Google Generative AI client
const getGoogleAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set")
  }
  return new GoogleGenAI({ apiKey })
}

interface CaptionGenerationOptions {
  imageUrl: string
  style?: string
}

export async function generateCaption(options: CaptionGenerationOptions) {
  const { imageUrl, style = "social media" } = options

  try {
    const genAI = getGoogleAIClient()

    // Extract base64 data from data URI
    const base64Data = imageUrl.split(",")[1]
    const mimeType = imageUrl.split(",")[0].split(":")[1].split(";")[0]

    // Use Gemini for image understanding
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Prepare prompt for caption generation
    const prompt = `Generate a concise, engaging ${style} caption for this image. Keep it under 2 sentences and make it catchy.`

    // Call Gemini with the image data
    const result = await model.generateContent({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    })

    // Extract the caption from the response
    const caption = result.response.text()

    return {
      success: true,
      caption,
    }
  } catch (error) {
    console.error("Error generating caption:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred during caption generation",
    }
  }
}
