"use server"

import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

// --- Configuration ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const STORAGE_BUCKET = "creatomate-assets"
const UPLOAD_PREFIX = "creatomate-assets"
const CREATOMATE_API_ENDPOINT = "https://api.creatomate.com/v1/renders"

// Define Template IDs for Creatomate templates
const TEMPLATE_IDS: Record<CreatomateTemplate, string> = {
  "social-reel": "543a4dfc-2286-45f1-acf5-86070a961708",
  "product-showcase": "4cc27f0e-4641-44c2-a768-6b757225e11f",
}

// --- Type Definitions ---
export type CreatomateTemplate = "social-reel" | "product-showcase"

export interface ProductShowcaseData {
  productName: string
  productDescription: string
  normalPrice: string
  discountedPrice: string
  cta: string
  website: string
  logoUrl: string | null
}

interface SlideInput {
  frameUrl: string // URL or Data URI
  caption?: string
}

interface GenerateVideoRequest {
  slides: SlideInput[]
  template: CreatomateTemplate
  aspectRatio: string
  productData?: ProductShowcaseData
}

interface CreatomateRender {
  id: string
  status: string
  url?: string
  template_id?: string
  template_name?: string
  output_format?: string
  error_message?: string
}

export interface CreatomateResponse {
  success: boolean
  renders?: CreatomateRender[]
  error?: string
}

// --- Helper Functions ---

// Initialize Supabase client with better error handling
function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase configuration")
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Ensure bucket exists
async function ensureBucket(bucketName: string) {
  const supabase = getSupabaseClient()
  const { data: buckets } = await supabase.storage.listBuckets()

  if (!buckets?.some((bucket) => bucket.name === bucketName)) {
    console.log(`Creating storage bucket: ${bucketName}`)
    await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
    })
  }
}

// Extract base64 data from various formats
function parseImageData(dataUri: string): { format: string; data: string } | null {
  // Standard data URI format
  let match = dataUri.match(/^data:image\/([a-zA-Z0-9-+.]+);base64,(.+)$/)
  if (match) {
    return { format: match[1], data: match[2] }
  }

  // Alternative format without media type
  match = dataUri.match(/^data:;base64,(.+)$/)
  if (match) {
    return { format: "png", data: match[1] }
  }

  // Just base64 prefix
  match = dataUri.match(/^base64,(.+)$/)
  if (match) {
    return { format: "png", data: match[1] }
  }

  // Raw base64 string
  if (/^[A-Za-z0-9+/=]+$/.test(dataUri)) {
    return { format: "png", data: dataUri }
  }

  return null
}

// Sanitize text for API
function sanitizeText(text?: string): string {
  if (!text) return ""
  return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim()
}

// Upload image to Supabase with better error handling
async function uploadImageToSupabase(base64Data: string, format: string, filePath: string): Promise<string> {
  try {
    const supabase = getSupabaseClient()
    await ensureBucket(STORAGE_BUCKET)

    const buffer = Buffer.from(base64Data, "base64")
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, buffer, {
      contentType: `image/${format}`,
      upsert: true,
    })

    if (error) throw error

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

    console.log(`Uploaded to Supabase: ${urlData.publicUrl}`)
    return urlData.publicUrl
  } catch (error) {
    console.error("Supabase upload error:", error)
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Process image source (URL or data URI)
async function processImageSource(imageSource: string, index: number, uploadPrefix: string): Promise<string> {
  // Handle URLs directly
  if (imageSource.startsWith("http")) {
    try {
      // Optionally fetch and re-upload for consistency
      const response = await fetch(imageSource, { method: "HEAD" })
      if (response.ok) {
        return imageSource // Use original URL if accessible
      }
    } catch {
      // Fall through to placeholder if URL is not accessible
    }
  }

  // Process data URI
  const imageData = parseImageData(imageSource)
  if (!imageData) {
    console.warn(`Could not parse image data for slide ${index + 1}, using placeholder.`)
    return `https://placehold.co/600x400/png?text=Slide+${index + 1}`
  }

  try {
    const imageFileName = `slide-${index + 1}.${imageData.format}`
    const imagePath = `${uploadPrefix}/${imageFileName}`
    return await uploadImageToSupabase(imageData.data, imageData.format, imagePath)
  } catch (error) {
    console.error(`Error uploading image ${index + 1}:`, error)
    return `https://placehold.co/600x400/png?text=Error+${index + 1}`
  }
}

// --- Core API Function ---
export async function generateCreatomateVideo({
  slides,
  template,
  aspectRatio,
  productData,
}: GenerateVideoRequest): Promise<CreatomateResponse> {
  console.log(`Starting Creatomate video generation with template: ${template}`)

  // Validate inputs
  const apiKey = process.env.CREATOMATE_API_KEY
  if (!apiKey) {
    return { success: false, error: "Missing Creatomate API Key" }
  }

  if (!slides || slides.length === 0) {
    return { success: false, error: "No slides provided" }
  }

  if (!template || !TEMPLATE_IDS[template]) {
    return { success: false, error: "Invalid template specified" }
  }

  if (template === "product-showcase" && !productData) {
    return { success: false, error: "Product data required for product-showcase template" }
  }

  // Create unique upload prefix
  const uniqueId = crypto.randomBytes(8).toString("hex")
  const uploadPrefix = `${UPLOAD_PREFIX}/${uniqueId}`
  console.log(`Using storage prefix: ${uploadPrefix}`)

  try {
    // Process all slides in sequence
    console.log(`Processing ${slides.length} slides...`)
    const processedSlides = []

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]
      const imageUrl = await processImageSource(slide.frameUrl, i, uploadPrefix)
      processedSlides.push({
        imageUrl,
        caption: slide.caption ? sanitizeText(slide.caption) : undefined,
      })
    }

    // Process logo if needed
    let logoUrl: string | undefined
    if (template === "product-showcase" && productData?.logoUrl) {
      if (productData.logoUrl.startsWith("http")) {
        logoUrl = productData.logoUrl
      } else {
        const logoData = parseImageData(productData.logoUrl)
        if (logoData) {
          const logoPath = `${uploadPrefix}/logo.${logoData.format}`
          logoUrl = await uploadImageToSupabase(logoData.data, logoData.format, logoPath)
        }
      }
    }

    // Prepare API payload
    const templateId = TEMPLATE_IDS[template]
    const modifications: Record<string, any> = {}

    // Set dimensions based on aspect ratio
    let width: number, height: number
    if (aspectRatio === "9:16") {
      width = 1080
      height = 1920
    } else if (aspectRatio === "1:1") {
      width = 1080
      height = 1080
    } else {
      // Default to 16:9
      width = 1920
      height = 1080
    }

    modifications.width = width
    modifications.height = height

    // Apply template-specific modifications
    if (template === "social-reel") {
      // Limit to 4 slides for social reel
      const maxSlides = Math.min(processedSlides.length, 4)

      for (let i = 0; i < maxSlides; i++) {
        const slide = processedSlides[i]
        modifications[`Image-${i + 1}.source`] = slide.imageUrl

        if (slide.caption) {
          modifications[`Text-${i + 1}.text`] = slide.caption
        }
      }
    } else if (template === "product-showcase" && productData) {
      // Product showcase template
      modifications["Product-Image.source"] = processedSlides[0]?.imageUrl
      modifications["Product-Name.text"] = sanitizeText(productData.productName) || "Product Name"
      modifications["Product-Description.text"] = sanitizeText(productData.productDescription) || "Product Description"
      modifications["Normal-Price.text"] = `$${productData.normalPrice.trim() || "99.99"}`
      modifications["Discounted-Price.text"] = `$${productData.discountedPrice.trim() || "79.99"}`
      modifications["CTA.text"] = sanitizeText(productData.cta) || "Shop Now"
      modifications["Website.text"] = sanitizeText(productData.website) || "www.example.com"

      if (logoUrl) {
        modifications["Logo.source"] = logoUrl
      }
    }

    // Prepare final request
    const requestData = {
      template_id: templateId,
      modifications,
      output_format: "mp4",
      frame_rate: 30,
    }

    console.log("Sending request to Creatomate:", JSON.stringify(requestData, null, 2))

    // Call Creatomate API
    const response = await fetch(CREATOMATE_API_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorDetails = `Creatomate API error: ${response.status}`

      try {
        const errorJson = JSON.parse(errorText)
        errorDetails += ` - ${errorJson.message || JSON.stringify(errorJson)}`
      } catch {
        errorDetails += ` - ${errorText}`
      }

      console.error(errorDetails)
      return { success: false, error: errorDetails }
    }

    const data = await response.json()
    console.log("Creatomate API response:", JSON.stringify(data, null, 2))

    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, error: "Invalid response from Creatomate API" }
    }

    return {
      success: true,
      renders: data,
    }
  } catch (error) {
    console.error("Error in generateCreatomateVideo:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function getCreatomateRenderStatus(renderId: string): Promise<{
  success: boolean
  status?: string
  url?: string
  error?: string
  errorMessage?: string
}> {
  console.log(`Checking render status for ID: ${renderId}`)

  const apiKey = process.env.CREATOMATE_API_KEY
  if (!apiKey) {
    return { success: false, error: "Missing Creatomate API Key" }
  }

  if (!renderId) {
    return { success: false, error: "Render ID is required" }
  }

  try {
    const response = await fetch(`${CREATOMATE_API_ENDPOINT}/${renderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store", // Prevent caching when polling
    })

    if (response.status === 404) {
      return { success: false, error: `Render with ID ${renderId} not found` }
    }

    const data = await response.json()

    if (!response.ok) {
      const errorMessage = data.error_message || `API request failed with status ${response.status}`
      return { success: false, error: errorMessage }
    }

    if (!data || typeof data !== "object" || !data.id || !data.status) {
      return { success: false, error: "Invalid response structure from API" }
    }

    return {
      success: true,
      status: data.status,
      url: data.url,
      errorMessage: data.error_message,
    }
  } catch (error) {
    console.error(`Error checking render status for ${renderId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
