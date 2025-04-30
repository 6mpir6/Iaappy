"use server"

import axios from "axios"
import { v4 as uuidv4 } from "uuid"
import { memoryStore } from "@/lib/memory-store" // Assuming this exists and works

// Types
interface GenerateVideoRequest {
  image: string // Base64 data URL or URL to image
  seed?: number // Optional seed for reproducibility
  cfgScale?: number // Optional cfg_scale parameter
  motionBucketId?: number // Optional motion_bucket_id parameter
  // Removed prompt: string; as it's not used by the Stability API endpoint
}

interface GenerateVideoResponse {
  id: string // Generation ID for tracking status
  status: "pending" | "completed" | "failed"
  videoUrl?: string // Only present when status is "completed" (Data URL)
  error?: string // Only present when status is "failed"
}

// Internal status structure stored in memoryStore
interface StoredStatus {
  status: "pending" | "completed" | "failed"
  createdAt?: string
  updatedAt?: string
  stabilityId?: string // Stability AI's generation ID
  videoUrl?: string
  error?: string
}

/**
 * Initiates a video generation request with Stability AI
 */
export async function generateStabilityVideo(request: GenerateVideoRequest): Promise<GenerateVideoResponse> {
  const internalId = uuidv4() // Use a distinct name for clarity
  try {
    // Check for API key
    const apiKey = process.env.STABILITY_API_KEY
    if (!apiKey) {
      console.error("STABILITY_API_KEY environment variable is not set")
      throw new Error("Server configuration error: Missing API Key.") // More user-friendly
    }

    // Store initial status in memory store
    const initialStatus: StoredStatus = {
      status: "pending",
      createdAt: new Date().toISOString(),
    }
    await memoryStore.set(`stability-video:${internalId}`, JSON.stringify(initialStatus))

    // Start the generation process in the background (don't await)
    startVideoGeneration(internalId, request, apiKey).catch(async (error) => {
      console.error(`Background video generation failed for ${internalId}:`, error)
      // Update status to failed
      const failedStatus: StoredStatus = {
        status: "failed",
        error: error.message || "Unknown error during video generation",
        updatedAt: new Date().toISOString(),
      }
      try {
        await memoryStore.set(`stability-video:${internalId}`, JSON.stringify(failedStatus))
      } catch (storeError) {
        console.error(`Failed to update memory store for failed generation ${internalId}:`, storeError)
      }
    })

    // Return the internal tracking ID immediately
    return {
      id: internalId,
      status: "pending",
    }
  } catch (error) {
    console.error("Error initiating video generation:", error)
    const errorMsg = error instanceof Error ? error.message : "Unknown error initiating video generation"
    // Attempt to store failure status even if initiation fails, using the generated ID
    const failedStatus: StoredStatus = {
      status: "failed",
      error: errorMsg,
      updatedAt: new Date().toISOString(),
    }
    try {
      await memoryStore.set(`stability-video:${internalId}`, JSON.stringify(failedStatus))
    } catch (storeError) {
      console.error(`Failed to update memory store for initial failed generation ${internalId}:`, storeError)
    }
    // Return a failed response directly
    return {
      id: internalId, // Return the ID used for potential storage attempt
      status: "failed",
      error: errorMsg,
    }
  }
}

/**
 * Checks the status of a video generation request using the internal ID
 */
export async function checkVideoGenerationStatus(id: string): Promise<GenerateVideoResponse> {
  try {
    const statusJson = await memoryStore.get(`stability-video:${id}`)

    if (!statusJson) {
      // It's possible the generation failed very early or the ID is wrong
      console.warn(`Generation status not found for ID: ${id}`)
      return {
        id,
        status: "failed",
        error: "Generation process not found or expired.", // More informative
      }
    }

    const status: StoredStatus = JSON.parse(statusJson)
    return {
      id,
      status: status.status,
      videoUrl: status.videoUrl,
      error: status.error,
    }
  } catch (error) {
    console.error(`Error checking video generation status for ${id}:`, error)
    return {
      id,
      status: "failed",
      // Avoid exposing detailed parsing errors to the client
      error: "Error retrieving generation status.",
    }
  }
}

/**
 * Background process to handle the video generation with Stability AI
 * This runs asynchronously after the initial request returns
 */
async function startVideoGeneration(internalId: string, request: GenerateVideoRequest, apiKey: string): Promise<void> {
  // Get current status to add stabilityId later
  const initialStatusJson = await memoryStore.get(`stability-video:${internalId}`)
  const currentStatus: StoredStatus = initialStatusJson ? JSON.parse(initialStatusJson) : { status: "pending" }

  try {
    // Step 1: Prepare the image data
    let imageBlob: Blob
    let sourceImageType = "image/png" // Default, try to get actual type

    if (request.image.startsWith("data:")) {
      // Handle base64 data URL
      const response = await fetch(request.image)
      if (!response.ok) {
        throw new Error(`Failed to fetch data URL image: ${response.status} ${response.statusText}`)
      }
      imageBlob = await response.blob()
      sourceImageType = imageBlob.type || sourceImageType // Get type from blob
    } else {
      // Handle URL to image
      const response = await fetch(request.image)
      if (!response.ok) {
        throw new Error(`Failed to fetch image URL: ${response.status} ${response.statusText}`)
      }
      imageBlob = await response.blob()
      sourceImageType = imageBlob.type || sourceImageType // Get type from blob
    }

    // Basic validation for Stability AI supported types (optional but good)
    if (!["image/jpeg", "image/png"].includes(sourceImageType)) {
      console.warn(`Image type ${sourceImageType} may not be optimal. Converting to PNG for Stability API.`)
      // Potentially add conversion logic here if needed, otherwise let API handle it
      sourceImageType = "image/png" // Default to PNG if unsure or unsupported
    }
    const filename = `image.${sourceImageType.split("/")[1] || "png"}`

    // Convert Blob to Buffer for FormData
    const arrayBuffer = await imageBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Check buffer size (Stability limit is 10MiB for the whole request)
    if (buffer.length > 9 * 1024 * 1024) {
      // Check image size slightly less than 10MB
      console.warn(
        `Image size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) is large, request might exceed 10MiB limit.`,
      )
    }

    // Step 2: Create FormData and append parameters
    const formData = new FormData()
    // Use the detected filename
    formData.append("image", buffer, filename)
    formData.append("seed", request.seed?.toString() || "0")
    formData.append("cfg_scale", request.cfgScale?.toString() || "1.8")
    formData.append("motion_bucket_id", request.motionBucketId?.toString() || "127")

    // Step 3: Make the API request to initiate generation
    console.log(`Initiating Stability video generation for internal ID: ${internalId}`)
    const response = await axios.request({
      url: "https://api.stability.ai/v2beta/image-to-video",
      method: "post",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        // Axios handles multipart/form-data header with boundary correctly
        // Accept: 'application/json' // Might be good practice for the initiation response
      },
      data: formData,
      validateStatus: undefined, // Handle all statuses manually
    })

    // Step 4: Handle the response
    if (response.status !== 200) {
      let errorDetails = ""
      try {
        errorDetails = response.data ? JSON.stringify(response.data) : (await response.data)?.toString()
      } catch {
        errorDetails = "(Could not parse error response body)"
      }
      throw new Error(`Stability API error on initiation: ${response.status} ${response.statusText} - ${errorDetails}`)
    }

    const stabilityGenerationId = response.data?.id
    if (!stabilityGenerationId) {
      throw new Error("No generation ID returned from Stability API")
    }
    console.log(`Stability generation started. API ID: ${stabilityGenerationId} for internal ID: ${internalId}`)

    // Update status with the Stability generation ID
    const pendingStatus: StoredStatus = {
      ...currentStatus, // Preserve createdAt
      status: "pending",
      stabilityId: stabilityGenerationId,
      updatedAt: new Date().toISOString(),
    }
    await memoryStore.set(`stability-video:${internalId}`, JSON.stringify(pendingStatus))

    // Step 5: Poll for completion
    await pollForCompletion(internalId, stabilityGenerationId, apiKey)
  } catch (error) {
    console.error(`Video generation process failed for internal ID ${internalId}:`, error)
    // Update status to failed
    const failedStatus: StoredStatus = {
      ...currentStatus, // Preserve createdAt and potentially stabilityId if obtained
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error during video generation process",
      updatedAt: new Date().toISOString(),
    }
    await memoryStore.set(`stability-video:${internalId}`, JSON.stringify(failedStatus))
    // No need to re-throw here as the .catch in generateStabilityVideo handles logging
  }
}

/**
 * Polls the Stability API until the video is ready or fails/times out
 */
async function pollForCompletion(internalId: string, stabilityId: string, apiKey: string): Promise<void> {
  let attempts = 0
  const maxAttempts = 90 // Increased timeout: 15 minutes (90 * 10 seconds)
  const pollInterval = 10000 // 10 seconds

  console.log(`Polling for completion of Stability ID: ${stabilityId} (Internal ID: ${internalId})`)

  // Get current status to preserve fields
  const currentStatusJson = await memoryStore.get(`stability-video:${internalId}`)
  const currentStatus: StoredStatus = currentStatusJson
    ? JSON.parse(currentStatusJson)
    : { status: "pending", stabilityId }

  while (attempts < maxAttempts) {
    attempts++

    // Wait *before* the attempt (except the first time)
    if (attempts > 1) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }

    try {
      console.log(`Polling attempt ${attempts}/${maxAttempts} for Stability ID: ${stabilityId}`)
      const response = await axios.request({
        url: `https://api.stability.ai/v2beta/image-to-video/result/${stabilityId}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "video/*", // Request raw video bytes
        },
        responseType: "arraybuffer", // Expect binary data
        validateStatus: (status) => status === 200 || status === 202 || status === 404, // Handle expected statuses
      })

      if (response.status === 200) {
        // Video is ready
        console.log(`Video generation completed successfully for Stability ID: ${stabilityId}`)
        const videoBuffer = Buffer.from(response.data)
        const base64Video = videoBuffer.toString("base64")
        const videoDataUrl = `data:video/mp4;base64,${base64Video}` // Assuming MP4, which is typical

        // Update status to completed with the video URL
        const completedStatus: StoredStatus = {
          ...currentStatus,
          status: "completed",
          videoUrl: videoDataUrl,
          updatedAt: new Date().toISOString(),
          error: undefined, // Clear any previous error
        }
        await memoryStore.set(`stability-video:${internalId}`, JSON.stringify(completedStatus))
        return // Exit polling loop
      } else if (response.status === 202) {
        // Still processing, log and continue loop (wait is handled at the start of the loop)
        console.log(`Video generation still in progress for ${stabilityId} (attempt ${attempts})`)
      } else if (response.status === 404) {
        // Not found - could be expired or wrong ID (less likely here)
        throw new Error(
          `Stability API Error: Generation result not found for ID: ${stabilityId}. It might have expired or failed silently.`,
        )
      } else {
        // Should not happen with validateStatus, but handle defensively
        throw new Error(`Unexpected status code from Stability API polling: ${response.status}`)
      }
    } catch (error) {
      console.error(`Error polling Stability API for ${stabilityId} (attempt ${attempts}):`, error)
      // Don't immediately fail the whole process on a single poll error, just retry
      if (attempts >= maxAttempts) {
        console.error(`Max polling attempts reached for ${stabilityId}. Marking as failed.`)
        const timeoutError = new Error("Video generation timed out after maximum polling attempts.")
        const failedStatus: StoredStatus = {
          ...currentStatus,
          status: "failed",
          error: timeoutError.message,
          updatedAt: new Date().toISOString(),
        }
        await memoryStore.set(`stability-video:${internalId}`, JSON.stringify(failedStatus))
        throw timeoutError // Propagate the timeout error
      }
      // Wait is handled at the start of the next loop iteration
    }
  }
  // Should be unreachable if maxAttempts logic is correct, but as a safeguard:
  if (attempts >= maxAttempts) {
    console.error(`Polling loop exited unexpectedly after max attempts for ${stabilityId}.`)
    const finalError = new Error("Video generation polling reached max attempts without success or explicit failure.")
    const failedStatus: StoredStatus = {
      ...currentStatus,
      status: "failed",
      error: finalError.message,
      updatedAt: new Date().toISOString(),
    }
    await memoryStore.set(`stability-video:${internalId}`, JSON.stringify(failedStatus))
    throw finalError
  }
}
