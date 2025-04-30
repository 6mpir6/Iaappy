"use server"

import { memoryStore } from "@/lib/memory-store"

export interface ImagePreviewUpdate {
  id: string
  url: string // Can be a standard URL or Base64 Data URI
}

export interface CodeUpdate {
  html?: string
  css?: string
  js?: string
  json?: string
}

export async function getGenerationUpdates(id: string) {
  try {
    // Get status messages
    const statusMessages = (await memoryStore.lrange(`generation:${id}:status`, 0, -1)) || []

    // Get thinking updates
    const thinkingUpdates = (await memoryStore.lrange(`generation:${id}:thinking`, 0, -1)) || []

    // Get the latest thinking update (the most complete one)
    const latestThinking = thinkingUpdates.length > 0 ? thinkingUpdates[thinkingUpdates.length - 1] : null

    // Get code generation updates
    const htmlUpdates = (await memoryStore.lrange(`generation:${id}:code:html`, 0, -1)) || []
    const cssUpdates = (await memoryStore.lrange(`generation:${id}:code:css`, 0, -1)) || []
    const jsUpdates = (await memoryStore.lrange(`generation:${id}:code:js`, 0, -1)) || []
    const jsonUpdates = (await memoryStore.lrange(`generation:${id}:code:json`, 0, -1)) || []

    // Get the latest code updates
    const latestHtml = htmlUpdates.length > 0 ? htmlUpdates[htmlUpdates.length - 1] : null
    const latestCss = cssUpdates.length > 0 ? cssUpdates[cssUpdates.length - 1] : null
    const latestJs = jsUpdates.length > 0 ? jsUpdates[jsUpdates.length - 1] : null
    const latestJson = jsonUpdates.length > 0 ? jsonUpdates[jsonUpdates.length - 1] : null

    // Combine code updates
    const codeUpdates: CodeUpdate = {}
    if (latestHtml) codeUpdates.html = latestHtml
    if (latestCss) codeUpdates.css = latestCss
    if (latestJs) codeUpdates.js = latestJs
    if (latestJson) codeUpdates.json = latestJson

    // Get image previews
    const rawImagePreviews = (await memoryStore.lrange(`generation:${id}:images`, 0, -1)) || []

    // Ensure previews are parsed correctly if stored as strings
    const imagePreviewsUrls: ImagePreviewUpdate[] = rawImagePreviews
      .map((item) => {
        try {
          return typeof item === "string" ? JSON.parse(item) : item
        } catch (error) {
          console.error("Error parsing image preview JSON:", error, "Raw item:", item)
          return { id: "error", url: "/placeholder.svg?text=ParseError" }
        }
      })
      .filter((item) => item && item.id && item.url) // Filter out invalid items

    console.log(
      `Found ${imagePreviewsUrls.length} image previews, ${thinkingUpdates.length} thinking updates, and code updates for generation ${id}`,
    )

    // Check if generation is complete
    const generationData = await memoryStore.get(`generation:${id}`)
    // Check if the status property exists and is 'completed'
    const isComplete =
      !!generationData && typeof generationData === "string" && JSON.parse(generationData).status === "completed"

    return {
      statusMessages,
      thinking: latestThinking,
      codeUpdates,
      imagePreviewsUrls,
      isComplete,
    }
  } catch (error) {
    console.error("Error getting generation updates:", error)
    // Return default structure on error
    return {
      statusMessages: ["Error retrieving status updates."],
      thinking: null,
      codeUpdates: {},
      imagePreviewsUrls: [],
      isComplete: false, // Assume not complete if there's an error
    }
  }
}
