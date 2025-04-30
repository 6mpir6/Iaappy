"use server"

import axios from "axios"

interface CreateVideoRequest {
  prompt: string
  image: string
}

interface CreateVideoResponse {
  videoUrl?: string
  error?: string
}

const runwayApiKey = process.env.RUNWAY_API_KEY

async function pollForVideo(generationId: string): Promise<string | null> {
  const url = `https://api.runwayml.com/v1/video/${generationId}`

  let attempts = 0
  const maxAttempts = 30 // Poll for up to 5 minutes (30 attempts * 10 seconds)

  return new Promise(async (resolve, reject) => {
    const interval = setInterval(async () => {
      attempts++
      try {
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${runwayApiKey}`,
          },
        })

        if (response.status === 200) {
          // Video generation complete
          clearInterval(interval)
          resolve(response.data.video_url)
        } else if (response.status === 202) {
          // Still processing
          console.log(`Polling: Generation ${generationId} still in progress... (Attempt ${attempts})`)
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
    if (!runwayApiKey) {
      throw new Error("Missing RUNWAY_API_KEY environment variable.")
    }

    const response = await axios.post(
      "https://api.runwayml.com/v1/video",
      {
        prompt: request.prompt,
        image: request.image,
      },
      {
        headers: {
          Authorization: `Bearer ${runwayApiKey}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (response.status !== 200) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`)
    }

    const generationId = response.data.id
    console.log("Generation ID:", generationId)

    // Poll for the video and return the URL
    const videoUrl = await pollForVideo(generationId)
    return { videoUrl }
  } catch (error: any) {
    console.error("Error in createRunwayVideo:", error)
    return { error: error.message }
  }
}
