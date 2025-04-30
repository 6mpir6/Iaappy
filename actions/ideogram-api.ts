"use server"

interface IdeogramGenerateRequest {
  prompt: string
  aspectRatio?: string
  model?: string
  styleType?: string
  negativePrompt?: string
  numImages?: number
  seed?: number
}

interface IdeogramRemixRequest {
  prompt: string
  imageFile: string // Base64 encoded image
  aspectRatio?: string
  imageWeight?: number
  model?: string
  styleType?: string
  numImages?: number
  seed?: number
}

interface IdeogramEditRequest {
  prompt: string
  imageFile: string // Base64 encoded image
  maskFile: string // Base64 encoded mask
  model?: string
  styleType?: string
  numImages?: number
  seed?: number
}

interface IdeogramUpscaleRequest {
  imageFile: string // Base64 encoded image
  prompt?: string
  resemblance?: number
  detail?: number
  numImages?: number
  seed?: number
}

interface IdeogramResponse {
  created: string
  data: Array<{
    prompt: string
    resolution: string
    is_image_safe: boolean
    seed: number
    url: string
    style_type?: string
  }>
}

/**
 * Generate images using Ideogram API
 */
export async function generateIdeogramImage(request: IdeogramGenerateRequest): Promise<string> {
  try {
    const apiKey = process.env.IDEOGRAM_API_KEY
    if (!apiKey) {
      throw new Error("IDEOGRAM_API_KEY environment variable is not set")
    }

    const body = {
      image_request: {
        prompt: request.prompt,
        aspect_ratio: request.aspectRatio || "ASPECT_1_1",
        model: request.model || "V_2",
        style_type: request.styleType || "REALISTIC",
        magic_prompt_option: "AUTO",
        num_images: request.numImages || 1,
      },
    }

    if (request.negativePrompt) {
      body.image_request.negative_prompt = request.negativePrompt
    }

    if (request.seed) {
      body.image_request.seed = request.seed
    }

    const response = await fetch("https://api.ideogram.ai/generate", {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ideogram API error (${response.status}): ${errorText}`)
    }

    const result = (await response.json()) as IdeogramResponse

    if (!result.data || result.data.length === 0 || !result.data[0].url) {
      throw new Error("No image URL found in Ideogram response")
    }

    // Return the image URL
    return result.data[0].url
  } catch (error) {
    console.error("Error in generateIdeogramImage:", error)
    return `/placeholder.svg?height=512&width=512&text=Generation+Error`
  }
}

/**
 * Remix an image using Ideogram API
 */
export async function remixIdeogramImage(request: IdeogramRemixRequest): Promise<string> {
  try {
    const apiKey = process.env.IDEOGRAM_API_KEY
    if (!apiKey) {
      throw new Error("IDEOGRAM_API_KEY environment variable is not set")
    }

    // Create FormData
    const formData = new FormData()

    // Add image request parameters
    const imageRequest = {
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio || "ASPECT_1_1",
      model: request.model || "V_2",
      style_type: request.styleType || "REALISTIC",
      image_weight: request.imageWeight || 50,
      magic_prompt_option: "AUTO",
      num_images: request.numImages || 1,
    }

    if (request.seed) {
      imageRequest.seed = request.seed
    }

    formData.append("image_request", JSON.stringify(imageRequest))

    // Convert base64 to blob and append to FormData
    const imageBlob = await base64ToBlob(request.imageFile)
    formData.append("image_file", imageBlob)

    const response = await fetch("https://api.ideogram.ai/remix", {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ideogram API error (${response.status}): ${errorText}`)
    }

    const result = (await response.json()) as IdeogramResponse

    if (!result.data || result.data.length === 0 || !result.data[0].url) {
      throw new Error("No image URL found in Ideogram response")
    }

    // Return the image URL
    return result.data[0].url
  } catch (error) {
    console.error("Error in remixIdeogramImage:", error)
    return `/placeholder.svg?height=512&width=512&text=Remix+Error`
  }
}

/**
 * Edit an image using Ideogram API
 */
export async function editIdeogramImage(request: IdeogramEditRequest): Promise<string> {
  try {
    const apiKey = process.env.IDEOGRAM_API_KEY
    if (!apiKey) {
      throw new Error("IDEOGRAM_API_KEY environment variable is not set")
    }

    // Create FormData
    const formData = new FormData()

    // Convert base64 to blob and append to FormData
    const imageBlob = await base64ToBlob(request.imageFile)
    formData.append("image_file", imageBlob)

    const maskBlob = await base64ToBlob(request.maskFile)
    formData.append("mask", maskBlob)

    // Add other parameters
    formData.append("prompt", request.prompt)
    formData.append("model", request.model || "V_2")

    if (request.styleType) {
      formData.append("style_type", request.styleType)
    }

    if (request.numImages) {
      formData.append("num_images", request.numImages.toString())
    }

    if (request.seed) {
      formData.append("seed", request.seed.toString())
    }

    const response = await fetch("https://api.ideogram.ai/edit", {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ideogram API error (${response.status}): ${errorText}`)
    }

    const result = (await response.json()) as IdeogramResponse

    if (!result.data || result.data.length === 0 || !result.data[0].url) {
      throw new Error("No image URL found in Ideogram response")
    }

    // Return the image URL
    return result.data[0].url
  } catch (error) {
    console.error("Error in editIdeogramImage:", error)
    return `/placeholder.svg?height=512&width=512&text=Edit+Error`
  }
}

/**
 * Upscale an image using Ideogram API
 */
export async function upscaleIdeogramImage(request: IdeogramUpscaleRequest): Promise<string> {
  try {
    const apiKey = process.env.IDEOGRAM_API_KEY
    if (!apiKey) {
      throw new Error("IDEOGRAM_API_KEY environment variable is not set")
    }

    // Create FormData
    const formData = new FormData()

    // Create image request object
    const imageRequest: any = {}

    if (request.prompt) {
      imageRequest.prompt = request.prompt
    }

    if (request.resemblance) {
      imageRequest.resemblance = request.resemblance
    }

    if (request.detail) {
      imageRequest.detail = request.detail
    }

    if (request.numImages) {
      imageRequest.num_images = request.numImages
    }

    if (request.seed) {
      imageRequest.seed = request.seed
    }

    formData.append("image_request", JSON.stringify(imageRequest))

    // Convert base64 to blob and append to FormData
    const imageBlob = await base64ToBlob(request.imageFile)
    formData.append("image_file", imageBlob)

    const response = await fetch("https://api.ideogram.ai/upscale", {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Ideogram API error (${response.status}): ${errorText}`)
    }

    const result = (await response.json()) as IdeogramResponse

    if (!result.data || result.data.length === 0 || !result.data[0].url) {
      throw new Error("No image URL found in Ideogram response")
    }

    // Return the image URL
    return result.data[0].url
  } catch (error) {
    console.error("Error in upscaleIdeogramImage:", error)
    return `/placeholder.svg?height=512&width=512&text=Upscale+Error`
  }
}

/**
 * Helper function to convert base64 to Blob
 */
async function base64ToBlob(base64: string): Promise<Blob> {
  // Extract the base64 data from the data URI
  const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 string")
  }

  const contentType = matches[1]
  const base64Data = matches[2]
  const byteCharacters = atob(base64Data)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }

  return new Blob(byteArrays, { type: contentType })
}
