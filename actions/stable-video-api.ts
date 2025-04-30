"use server"

import axios from "axios"
import FormData from "form-data"

interface CreateVideoRequest {
  prompt: string
  image: string
}

interface CreateVideoResponse {
  videoUrl?: string
  error?: string
}

const stabilityApiKey = process.env.STABILITY_API_KEY

async function pollForVideo(generationId: string): Promise<string | null> {
  const url = `https://api.stability.ai/v2beta/image-to-video/result/${generationId}`

  let attempts = 0
  const maxAttempts = 30 // Poll for up to 5 minutes (30 attempts * 10 seconds)

  return new Promise(async (resolve, reject) => {
    const interval = setInterval(async () => {
      attempts++
      try {
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          headers: {
            Authorization: `Bearer ${stabilityApiKey}`,
            Accept: "video/*",
          },
          validateStatus: (status) => status === 200 || status === 202 || status === 404,
        })

        if (response.status === 200) {
          // Video generation complete
          clearInterval(interval)

          // Convert ArrayBuffer to Base64 Data URL
          const buffer = Buffer.from(response.data)
          const base64Video = buffer.toString("base64")
          const videoDataUrl = `data:video/mp4;base64,${base64Video}`

          resolve(videoDataUrl)
        } else if (response.status === 202) {
          // Still processing
          console.log(`Polling: Generation ${generationId} still in progress... (Attempt ${attempts})`)
        } else if (response.status === 404) {
          clearInterval(interval)
          reject(new Error(`Video not found or expired for generation ID: ${generationId}`))
        } else {
          clearInterval(interval)
          reject(new Error(`Unexpected status code: ${response.status}`))
        }
      } catch (error: any) {
        clearInterval(interval)
        reject(new Error(`Error during polling: ${error.message}`))
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval)
        reject(new Error("Maximum polling attempts reached. Video generation timed out."))
      }
    }, 10000) // Poll every 10 seconds
  })
}

export async function createRunwayVideo(request: CreateVideoRequest): Promise<CreateVideoResponse> {
  try {
    if (!stabilityApiKey) {
      throw new Error("Missing STABILITY_API_KEY environment variable.")
    }

    const data = new FormData()

    // Convert base64 to blob
    const response = await fetch(request.image)
    const blob = await response.blob()
    data.append("image", blob, "image.png")
    data.append("seed", "0")
    data.append("cfg_scale", "1.8")
    data.append("motion_bucket_id", "127")

    // FIXED: Removed the spread of data.getHeaders() to avoid Symbol.toPrimitive error
    const axiosResponse = await axios.request({
      url: `https://api.stability.ai/v2beta/image-to-video`,
      method: "POST",
      validateStatus: undefined,
      headers: {
        Authorization: `Bearer ${stabilityApiKey}`,
        // Let Axios handle the Content-Type header automatically
      },
      data: data,
    })

    if (axiosResponse.status === 429) {
      throw new Error("Rate limit exceeded. Please wait and try again.")
    }

    if (axiosResponse.status !== 200) {
      throw new Error(`API Error: ${axiosResponse.status} - ${axiosResponse.statusText}`)
    }

    const generationId = axiosResponse.data.id
    console.log("Generation ID:", generationId)

    // Poll for the video and return the URL
    const videoUrl = await pollForVideo(generationId)
    return { videoUrl }
  } catch (error: any) {
    console.error("Error in createRunwayVideo:", error)
    return { error: error.message }
  }
}
