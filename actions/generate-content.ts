"use server"

import { GoogleGenAI } from "@google/genai"
import { HarmCategory, HarmBlockThreshold } from "@google/genai"

// Helper to get API Client
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY environment variable is not set.")
    throw new Error("Server configuration error: Missing Gemini API Key.")
  }
  return new GoogleGenAI({ apiKey })
}

/**
 * Extracts JSON from text response
 */
export async function extractJsonFromText(text: string): Promise<any> {
  try {
    // Look for JSON in code blocks first
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim())
      } catch (e) {
        console.warn("Failed to parse JSON from code block, trying full text.")
      }
    }

    // Try parsing the whole text (or the first likely JSON object)
    const objectMatch = text.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0])
      } catch (e) {
        console.warn("Failed to parse JSON from object match, trying direct parse.")
      }
    }

    // Try parsing the entire text directly
    try {
      return JSON.parse(text)
    } catch (e) {
      console.warn("Failed to parse direct JSON, attempting to extract structured data from text.")
      // Return a simple object with the text for fallback
      return { content: text }
    }
  } catch (error) {
    console.error("JSON extraction failed:", error)
    return { content: text, error: "Failed to parse as JSON" }
  }
}

/**
 * Generate content using Gemini API
 */
export async function generateContent(prompt: string, systemInstruction?: string): Promise<any> {
  try {
    const genAI = getGenAIClient()
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    }

    // Prepare the request
    const request = systemInstruction
      ? {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
          ],
        }
      : {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
          ],
        }

    // Generate content
    const result = await model.generateContent(request)

    // Check if response has the expected structure
    if (!result || !result.response) {
      console.error("Invalid response structure from Gemini API:", JSON.stringify(result, null, 2))
      throw new Error("Received invalid response structure from Gemini API")
    }

    // Extract text from response
    const responseText = result.response.text()

    // Try to parse as JSON if needed
    if (responseText.includes("{") && responseText.includes("}")) {
      try {
        return await extractJsonFromText(responseText)
      } catch (error) {
        console.warn("Failed to parse response as JSON, returning raw text")
        return { content: responseText }
      }
    }

    return { content: responseText }
  } catch (error) {
    console.error("Error in generateContent:", error)
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      content: "Failed to generate content. Please try again.",
    }
  }
}
