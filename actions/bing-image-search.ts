"use server"

interface BingImageSearchOptions {
  query: string
  count?: number
  offset?: number
  mkt?: string
  safeSearch?: "Off" | "Moderate" | "Strict"
  aspect?: string
  color?: string
  freshness?: string
  height?: number
  width?: number
  imageType?: string
  license?: string
  size?: string
  site?: string
}

interface BingImageSearchResponse {
  images: Array<{
    id: string
    url: string
    contentUrl: string
    name: string
    thumbnailUrl: string
    width: number
    height: number
    hostPageUrl: string
    hostPageDisplayUrl: string
    encodingFormat: string
  }>
  totalEstimatedMatches: number
  nextOffset?: number
  error?: string
}

/**
 * Search for images using Bing Image Search API
 * @param options Search options
 * @returns Promise with search results
 */
export async function searchBingImages(options: BingImageSearchOptions): Promise<BingImageSearchResponse> {
  try {
    // Check for API key
    const apiKey = process.env.BING_SEARCH_API_KEY
    if (!apiKey) {
      console.error("BING_SEARCH_API_KEY environment variable is not set")
      throw new Error("Bing Search API key not configured")
    }

    // Build query parameters
    const params = new URLSearchParams()
    params.append("q", options.query)

    if (options.count) params.append("count", options.count.toString())
    if (options.offset) params.append("offset", options.offset.toString())
    if (options.mkt) params.append("mkt", options.mkt)
    if (options.safeSearch) params.append("safeSearch", options.safeSearch)
    if (options.aspect) params.append("aspect", options.aspect)
    if (options.color) params.append("color", options.color)
    if (options.freshness) params.append("freshness", options.freshness)
    if (options.height) params.append("height", options.height.toString())
    if (options.width) params.append("width", options.width.toString())
    if (options.imageType) params.append("imageType", options.imageType)
    if (options.license) params.append("license", options.license)
    if (options.size) params.append("size", options.size)

    // Add site: operator to query if specified
    if (options.site) {
      const siteQuery = `${options.query} site:${options.site}`
      params.set("q", siteQuery)
    }

    // Make the API request
    const response = await fetch(`https://api.bing.microsoft.com/v7.0/images/search?${params.toString()}`, {
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        Accept: "application/json",
        "User-Agent": "WebCraftAI/1.0",
      },
      cache: "no-store", // Don't cache the response
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Bing API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()

    // Transform the response to our format
    return {
      images: data.value.map((image: any) => ({
        id: image.imageId || `bing-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url: image.contentUrl,
        contentUrl: image.contentUrl,
        name: image.name,
        thumbnailUrl: image.thumbnailUrl,
        width: image.width,
        height: image.height,
        hostPageUrl: image.hostPageUrl,
        hostPageDisplayUrl: image.hostPageDisplayUrl,
        encodingFormat: image.encodingFormat,
      })),
      totalEstimatedMatches: data.totalEstimatedMatches,
      nextOffset: data.nextOffset,
    }
  } catch (error) {
    console.error("Error searching Bing images:", error)
    return {
      images: [],
      totalEstimatedMatches: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Convert a Bing image to a base64 data URI
 * @param imageUrl The URL of the image to convert
 * @returns Promise with the base64 data URI
 */
export async function bingImageToDataUri(imageUrl: string): Promise<string> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    // Convert to buffer and then to base64
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")

    // Determine MIME type from response headers or default to image/jpeg
    const contentType = response.headers.get("content-type") || "image/jpeg"

    // Return as data URI
    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error("Error converting Bing image to data URI:", error)
    // Return a placeholder instead of throwing
    return `/placeholder.svg?height=400&width=400&text=Image+Error`
  }
}
