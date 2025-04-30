"use server"

import { removeBackground } from "./remove-background"

interface LogoGenerationRequest {
  companyName: string
  description: string
  style?: string // Keep style option if Ideogram supports it
}

interface LogoGenerationResponse {
  url: string // Will contain Base64 Data URI after background removal, or original/placeholder
}

/**
 * Generates a logo using the Ideogram API and attempts background removal.
 * @param request Logo generation request parameters
 * @returns Object containing the URL (likely Base64 Data URI) of the generated logo
 */
export async function generateLogo(request: LogoGenerationRequest): Promise<LogoGenerationResponse> {
  console.log(`Generating logo for: ${request.companyName}`)
  try {
    // Check for Ideogram API key
    const apiKey = process.env.IDEOGRAM_API_KEY
    if (!apiKey) {
      console.error("CRITICAL: IDEOGRAM_API_KEY environment variable is not set.")
      throw new Error("Server configuration error: Missing Ideogram API Key.")
    }

    const { companyName, description, style = "MINIMALIST" } = request // Default to MINIMALIST

    // Construct a prompt suitable for logo generation
    const prompt = `Clean vector logo for a company named "${companyName}". The company is about: ${description}. Style: ${style}, minimalist, professional, modern. Centered on white background.`
    console.log(`Ideogram prompt: ${prompt}`)

    // Ideogram API endpoint and request body
    const apiUrl = "https://api.ideogram.ai/v2/images/generations" // Use v2 API
    const requestBody = {
      prompt: prompt,
      aspect_ratio: "1:1", // Square for logo
      num_generations: 1,
      output_resolution: 1024, // Request higher resolution
      style: style, // Pass style if API supports it
      response_format: "json",
    }

    // Call the Ideogram API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`, // Bearer token format
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Ideogram API error (${response.status}): ${errorText}`)
      throw new Error(`Ideogram API error (${response.status}): ${errorText.substring(0, 200)}`)
    }

    // Parse the response
    const result = await response.json()
    console.log("Ideogram response:", JSON.stringify(result).substring(0, 300) + "...")

    // Extract the image URL
    const logoUrl = result?.generations?.[0]?.images?.[0]?.url

    if (!logoUrl) {
      console.error("Could not extract logo URL from Ideogram response:", result)
      throw new Error("No logo URL found in Ideogram response")
    }

    console.log(`Ideogram generated logo URL: ${logoUrl}`)

    // Attempt to remove the background
    console.log("Attempting background removal for the logo...")
    try {
      const transparentLogo = await removeBackground(logoUrl)
      // Check if background removal returned an error placeholder
      if (transparentLogo.imageUrl.includes("BG+Remove+Error")) {
        console.warn("Background removal failed, returning original logo URL.")
        return { url: logoUrl } // Return original if removal failed
      }
      console.log("Background removal successful for logo.")
      return {
        url: transparentLogo.imageUrl, // Return the Base64 Data URI from removeBackground
      }
    } catch (bgError) {
      console.error("Error during background removal, returning original logo URL:", bgError)
      // Return the original URL from Ideogram if removeBackground throws an error
      return {
        url: logoUrl,
      }
    }
  } catch (error) {
    console.error("Error in generateLogo function:", error)
    const message = error instanceof Error ? error.message : "Unknown error"

    // Return a clear placeholder indicating logo generation failure
    return {
      url: `/placeholder.svg?height=200&width=200&text=Logo+Gen+Error`,
    }
  }
}
