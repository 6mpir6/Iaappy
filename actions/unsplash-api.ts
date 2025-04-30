"use server"

// Define interfaces for Unsplash API responses
export interface UnsplashPhoto {
  id: string
  width: number
  height: number
  color: string
  description: string | null
  alt_description: string | null
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  links: {
    self: string
    html: string
    download: string
    download_location: string
  }
  user: {
    name: string
    username: string
  }
}

export interface UnsplashSearchResponse {
  total: number
  total_pages: number
  results: UnsplashPhoto[]
}

/**
 * Search for photos on Unsplash based on a query
 * @param query Search term
 * @param page Page number (default: 1)
 * @param perPage Number of photos per page (default: 10)
 * @param orientation Photo orientation (optional)
 * @returns Promise with search results
 */
export async function searchUnsplashPhotos(
  query: string,
  page = 1,
  perPage = 10,
  orientation?: "landscape" | "portrait" | "squarish",
): Promise<UnsplashSearchResponse> {
  // Check if API key is available
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    console.error("UNSPLASH_ACCESS_KEY environment variable is not set")
    throw new Error("Unsplash API key not configured")
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

    // Make the API request
    const response = await fetch(`https://api.unsplash.com/search/photos?${params.toString()}`, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
      cache: "no-store", // Don't cache the response
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Unsplash API error (${response.status}): ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error searching Unsplash photos:", error)
    // Return empty results instead of throwing
    return { total: 0, total_pages: 0, results: [] }
  }
}

/**
 * Get a random photo from Unsplash based on a query
 * @param query Search term
 * @param count Number of photos to return (default: 1)
 * @param orientation Photo orientation (optional)
 * @returns Promise with random photos
 */
export async function getRandomUnsplashPhoto(
  query: string,
  count = 1,
  orientation?: "landscape" | "portrait" | "squarish",
): Promise<UnsplashPhoto[]> {
  // Check if API key is available
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    console.error("UNSPLASH_ACCESS_KEY environment variable is not set")
    throw new Error("Unsplash API key not configured")
  }

  try {
    // First try to search for photos with the query
    const searchResults = await searchUnsplashPhotos(query, 1, Math.min(count, 30), orientation)

    if (searchResults.results && searchResults.results.length > 0) {
      // If we have search results, return a random selection from them
      const shuffled = [...searchResults.results].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, count)
    }

    // If search returns no results, fall back to random photos
    const params = new URLSearchParams({
      query,
      count: Math.min(count, 30).toString(), // Maximum 30 photos per request
    })

    if (orientation) {
      params.append("orientation", orientation)
    }

    // Make the API request
    const response = await fetch(`https://api.unsplash.com/photos/random?${params.toString()}`, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
      cache: "no-store", // Don't cache the response
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Unsplash API error (${response.status}): ${errorText}`)
    }

    // If count is 1, the response is a single object, otherwise it's an array
    const data = await response.json()
    return Array.isArray(data) ? data : [data]
  } catch (error) {
    console.error("Error getting random Unsplash photo:", error)
    // Return empty array instead of throwing
    return []
  }
}

/**
 * Track a photo download (required by Unsplash API guidelines)
 * @param downloadLocation The download_location URL from the photo object
 * @returns Promise with the download URL
 */
export async function trackUnsplashDownload(downloadLocation: string): Promise<string> {
  // Check if API key is available
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    console.error("UNSPLASH_ACCESS_KEY environment variable is not set")
    throw new Error("Unsplash API key not configured")
  }

  try {
    // Make the API request
    const response = await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Unsplash API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    return data.url
  } catch (error) {
    console.error("Error tracking Unsplash download:", error)
    throw error
  }
}

/**
 * Convert an Unsplash photo to a base64 data URI
 * @param photo The Unsplash photo object
 * @returns Promise with the base64 data URI
 */
export async function unsplashPhotoToDataUri(photo: UnsplashPhoto): Promise<string> {
  try {
    // Track the download (required by Unsplash API guidelines)
    await trackUnsplashDownload(photo.links.download_location)

    // Fetch the image
    const response = await fetch(photo.urls.regular)
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
    console.error("Error converting Unsplash photo to data URI:", error)
    // Return a placeholder instead of throwing
    return `/placeholder.svg?height=400&width=400&text=Image+Error`
  }
}
