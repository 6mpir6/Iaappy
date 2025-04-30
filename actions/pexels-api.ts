"use server"

// Define interfaces for Pexels API responses
export interface PexelsPhoto {
  id: string
  width: number
  height: number
  url: string
  photographer: string
  photographer_url: string
  photographer_id: number
  avg_color: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
  liked: boolean
  alt: string
}

export interface PexelsSearchResponse {
  total_results: number
  page: number
  per_page: number
  photos: PexelsPhoto[]
  next_page?: string
  prev_page?: string
}

/**
 * Search for photos on Pexels based on a query
 * @param query Search term
 * @param page Page number (default: 1)
 * @param perPage Number of photos per page (default: 15, max: 80)
 * @param orientation Photo orientation (optional)
 * @param size Minimum photo size (optional)
 * @param color Desired photo color (optional)
 * @returns Promise with search results
 */
export async function searchPexelsPhotos(
  query: string,
  page = 1,
  perPage = 15,
  orientation?: "landscape" | "portrait" | "square",
  size?: "large" | "medium" | "small",
  color?: string,
): Promise<PexelsSearchResponse> {
  // Check if API key is available
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) {
    console.error("PEXELS_API_KEY environment variable is not set")
    throw new Error("Pexels API key not configured")
  }

  try {
    // Build the URL with query parameters
    const params = new URLSearchParams({
      query,
      page: page.toString(),
      per_page: perPage.toString(),
    })

    if (orientation) {
      params.append("orientation", orientation)
    }

    if (size) {
      params.append("size", size)
    }

    if (color) {
      params.append("color", color)
    }

    // Make the API request
    const response = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
      headers: {
        Authorization: apiKey,
      },
      cache: "no-store", // Don't cache the response
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Pexels API error (${response.status}): ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error searching Pexels photos:", error)
    // Return empty results instead of throwing
    return { total_results: 0, page: 1, per_page: perPage, photos: [] }
  }
}

/**
 * Get a random photo from Pexels based on a query
 * @param query Search term
 * @param count Number of photos to return (default: 1)
 * @param orientation Photo orientation (optional)
 * @returns Promise with random photos
 */
export async function getRandomPexelsPhoto(
  query: string,
  count = 1,
  orientation?: "landscape" | "portrait" | "square",
): Promise<PexelsPhoto[]> {
  // Check if API key is available
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) {
    console.error("PEXELS_API_KEY environment variable is not set")
    throw new Error("Pexels API key not configured")
  }

  try {
    // Search for photos with the query
    const searchResults = await searchPexelsPhotos(query, 1, Math.min(count, 80), orientation)

    if (searchResults.photos && searchResults.photos.length > 0) {
      // If we have search results, return a random selection from them
      const shuffled = [...searchResults.photos].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, count)
    }

    // If search returns no results, return an empty array
    return []
  } catch (error) {
    console.error("Error getting random Pexels photo:", error)
    // Return empty array instead of throwing
    return []
  }
}

/**
 * Convert a Pexels photo to a base64 data URI
 * @param photo The Pexels photo object
 * @returns Promise with the base64 data URI
 */
export async function pexelsPhotoToDataUri(photo: PexelsPhoto): Promise<string> {
  try {
    // Determine which image size to use (medium is a good balance)
    const imageUrl = photo.src.medium || photo.src.original

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
    console.error("Error converting Pexels photo to data URI:", error)
    // Return a placeholder instead of throwing
    return `/placeholder.svg?height=400&width=400&text=Image+Error`
  }
}
