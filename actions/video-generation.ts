"use server"

import type { VideoGenerationOptions, VideoTheme, Scene } from "@/components/video-generator/types"
import { generateCreatomateVideo, getCreatomateRenderStatus } from "./generate-creatomate-video"

// --- Type Definitions ---
interface VideoGenerationTask {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  progress: number
  videoUrl?: string
  error?: string
  theme: VideoTheme
  createdAt: Date
  creatomateRenderId?: string
  lastChecked?: Date
}

// In-memory storage (would use a database in production)
const videoTasks = new Map<string, VideoGenerationTask>()

// Generate a unique task ID
const generateId = () => `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

/**
 * Initiates video generation with the provided options
 */
export async function generateVideo(options: VideoGenerationOptions) {
  const { scenes, theme, productData } = options

  // Validate input
  if (!scenes.length) {
    return { success: false, error: "No scenes provided" }
  }

  // Create task record
  const generationId = generateId()
  videoTasks.set(generationId, {
    id: generationId,
    status: "pending",
    progress: 0,
    theme,
    createdAt: new Date(),
  })

  // Start generation process asynchronously
  startVideoGeneration(generationId, scenes, theme, productData).catch((error) => {
    console.error("Error in background video generation:", error)
    const task = videoTasks.get(generationId)
    if (task) {
      task.status = "failed"
      task.error = error instanceof Error ? error.message : "Unknown error"
      videoTasks.set(generationId, task)
    }
  })

  return {
    success: true,
    generationId,
  }
}

/**
 * Gets the current status of a video generation task
 */
export async function getVideoStatus(id: string) {
  const task = videoTasks.get(id)

  if (!task) {
    return {
      success: false,
      error: "Video generation task not found",
    }
  }

  // Check Creatomate status if we have a render ID and task is still processing
  if (task.creatomateRenderId && task.status === "processing") {
    // Limit polling frequency to avoid rate limits
    const now = new Date()
    const shouldCheck = !task.lastChecked || now.getTime() - task.lastChecked.getTime() > 2000 // Check every 2 seconds

    if (shouldCheck) {
      task.lastChecked = now
      videoTasks.set(id, task)

      try {
        const creatomateStatus = await getCreatomateRenderStatus(task.creatomateRenderId)

        if (creatomateStatus.success) {
          // Update task based on Creatomate status
          if (creatomateStatus.status === "succeeded") {
            task.status = "completed"
            task.progress = 1
            task.videoUrl = creatomateStatus.url
          } else if (creatomateStatus.status === "failed") {
            task.status = "failed"
            task.error = creatomateStatus.errorMessage || "Rendering failed"
          } else {
            // Map intermediate statuses to progress values
            switch (creatomateStatus.status) {
              case "planned":
                task.progress = 0.1
                break
              case "waiting":
                task.progress = 0.3
                break
              case "transcribing":
                task.progress = 0.4
                break
              case "rendering":
                task.progress = 0.6
                break
              default:
                task.progress = 0.2
            }
          }

          videoTasks.set(id, task)
        }
      } catch (error) {
        console.error(`Error checking Creatomate status for ${id}:`, error)
      }
    }
  }

  return {
    success: true,
    status: task.status,
    progress: task.progress,
    videoUrl: task.videoUrl,
    error: task.error,
  }
}

/**
 * Handles the video generation process
 */
async function startVideoGeneration(generationId: string, scenes: Scene[], theme: VideoTheme, productData?: any) {
  // Update task status
  const task = videoTasks.get(generationId)
  if (!task) return

  task.status = "processing"
  videoTasks.set(generationId, task)

  // Choose generation method based on theme
  if (theme === "social-reel" || theme === "product-showcase") {
    await generateWithCreatomate(generationId, scenes, theme, productData)
  } else {
    // Fallback for other themes
    await simulateVideoGeneration(generationId, scenes, theme)
  }
}

/**
 * Generates video using Creatomate API
 */
async function generateWithCreatomate(generationId: string, scenes: Scene[], theme: VideoTheme, productData?: any) {
  updateProgress(generationId, 0.1)

  // Prepare slides for Creatomate
  const slides = scenes.map((scene) => ({
    frameUrl: scene.imageUrl,
    caption: scene.caption,
  }))

  // Determine aspect ratio from first scene or default to 16:9
  const aspectRatio = scenes[0]?.aspectRatio || "16:9"

  // Format product data if needed
  let formattedProductData = undefined
  if (theme === "product-showcase" && productData) {
    formattedProductData = {
      productName: productData.productName || "",
      productDescription: productData.productDescription || "",
      normalPrice: productData.normalPrice || "",
      discountedPrice: productData.discountedPrice || "",
      cta: productData.cta || "",
      website: productData.website || "",
      logoUrl: productData.logoUrl || null,
    }
  }

  // Call Creatomate API
  const response = await generateCreatomateVideo({
    slides,
    template: theme as "social-reel" | "product-showcase",
    aspectRatio,
    productData: formattedProductData,
  })

  if (!response.success) {
    throw new Error(response.error || "Failed to generate video")
  }

  // Store render ID for status checking
  const task = videoTasks.get(generationId)
  if (!task) return

  if (response.renders && response.renders.length > 0) {
    task.creatomateRenderId = response.renders[0].id
    task.progress = 0.3
    videoTasks.set(generationId, task)

    // Check initial status
    const initialStatus = await getCreatomateRenderStatus(response.renders[0].id)
    if (initialStatus.success && initialStatus.status === "succeeded") {
      task.status = "completed"
      task.progress = 1
      task.videoUrl = initialStatus.url
      videoTasks.set(generationId, task)
    }
  } else {
    throw new Error("No render information returned")
  }
}

/**
 * Simulates video generation for testing or unsupported themes
 */
async function simulateVideoGeneration(generationId: string, scenes: Scene[], theme: VideoTheme) {
  // Simulate progress updates
  for (let progress = 0; progress <= 100; progress += 10) {
    updateProgress(generationId, progress / 100)
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Complete the task
  const task = videoTasks.get(generationId)
  if (!task) return

  task.status = "completed"
  task.progress = 1
  task.videoUrl = "https://example.com/sample-video.mp4"
  videoTasks.set(generationId, task)
}

/**
 * Updates the progress of a video generation task
 */
function updateProgress(generationId: string, progress: number) {
  const task = videoTasks.get(generationId)
  if (task) {
    task.progress = progress
    videoTasks.set(generationId, task)
  }
}
