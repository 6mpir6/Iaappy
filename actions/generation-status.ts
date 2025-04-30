"use server"

import { memoryStore } from "@/lib/memory-store"

interface GenerationStatus {
  status:
    | "pending"
    | "starting"
    | "planning"
    | "code"
    | "content"
    | "images"
    | "generate-images"
    | "integrate"
    | "analysis"
    | "finalize"
    | "completed"
    | "failed"
  result?: any // Contains the final code if status is 'completed'
  error?: string // Contains error message if status is 'failed'
}

export async function getGenerationStatus(id: string): Promise<GenerationStatus> {
  try {
    const resultString = await memoryStore.get(`generation:${id}`)

    if (!resultString) {
      console.log(`No status found for generation ID: ${id}`)
      return { status: "pending" }
    }

    // Safely parse the JSON string
    try {
      const result = JSON.parse(resultString)
      console.log(`Status for ${id}: ${result.status}`)
      // Basic validation
      if (typeof result === "object" && result !== null && typeof result.status === "string") {
        return result as GenerationStatus
      } else {
        console.error(`Invalid status format found for ID ${id}:`, resultString)
        return { status: "failed", error: "Invalid status format stored." }
      }
    } catch (parseError) {
      console.error(`Error parsing status JSON for ID ${id}:`, parseError)
      console.error("Raw status string:", resultString)
      return { status: "failed", error: "Failed to parse stored status." }
    }
  } catch (error) {
    console.error(`Error getting generation status for ID ${id}:`, error)
    // Don't throw, return a failed status
    return {
      status: "failed",
      error: `Failed to retrieve status: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
