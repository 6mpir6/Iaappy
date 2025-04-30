"use server"

interface RemoveBgResponse {
  imageUrl: string
  width: number
  height: number
}

/**
 * Removes the background from an image using the remove.bg API
 * @param imageUrl URL of the image to process (can be http/https or base64 data URI)
 * @returns Object containing the URL of the processed image and its dimensions
 */
export async function removeBackground(imageUrl: string): Promise<RemoveBgResponse> {
  console.log(`Attempting to remove background for image: ${imageUrl.substring(0, 60)}...`)
  try {
    // Check for API key
    const apiKey = process.env.REMOVE_BG_API_KEY
    if (!apiKey) {
      console.error("CRITICAL: REMOVE_BG_API_KEY environment variable is not set.")
      throw new Error("Server configuration error: Missing Remove.bg API Key.")
    }

    // Use FormData for the request
    const formData = new FormData()
    formData.append("size", "auto") // Let remove.bg determine size

    // Check if the input is a Data URL or a regular URL
    if (imageUrl.startsWith("data:")) {
      // Convert Base64 Data URL to Blob
      const fetchResponse = await fetch(imageUrl)
      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch base64 data URI: ${fetchResponse.statusText}`)
      }
      const blob = await fetchResponse.blob()
      formData.append("image_file", blob, "image_from_data_url.png") // Provide a filename
      console.log("Processing Base64 Data URL for background removal.")
    } else {
      // Assume it's a fetchable URL
      formData.append("image_url", imageUrl)
      console.log("Processing image URL for background removal.")
    }

    // Call the remove.bg API
    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        // Content-Type is set automatically by fetch when using FormData
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Remove.bg API error (${response.status}): ${errorText}`)
      throw new Error(`Remove.bg API error (${response.status}): ${errorText.substring(0, 200)}`)
    }

    // Get the result as a Blob
    const resultBlob = await response.blob()

    // Convert the result Blob back to a Base64 Data URL using Buffer
    const buffer = Buffer.from(await resultBlob.arrayBuffer())
    const base64ResultUrl = `data:${resultBlob.type || "image/png"};base64,${buffer.toString("base64")}`

    console.log("Background removal successful. Returning Base64 Data URL.")

    // Placeholder dimensions - remove.bg doesn't easily return dimensions in API v1.0
    // In a real app, you might need another step to get dimensions or estimate them.
    const width = 500 // Placeholder
    const height = 500 // Placeholder

    return {
      imageUrl: base64ResultUrl,
      width,
      height,
    }
  } catch (error) {
    console.error("Error in removeBackground function:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    // Return a placeholder indicating the failure clearly
    return {
      imageUrl: `/placeholder.svg?height=200&width=200&text=BG+Remove+Error`,
      width: 200,
      height: 200,
    }
  }
}
