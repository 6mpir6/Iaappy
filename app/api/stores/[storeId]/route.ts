import { type NextRequest, NextResponse } from "next/server"
import type { StoreFormData } from "@/types/store"

// In-memory store for demo purposes
const storeDatabase: Map<string, StoreFormData> = new Map()

export async function GET(request: NextRequest, { params }: { params: { storeId: string } }) {
  const storeId = params.storeId

  if (!storeId) {
    return NextResponse.json({ message: "storeId parameter is required." }, { status: 400 })
  }

  console.log(`API: Fetching store data for ID: ${storeId}`)

  try {
    const storeData = storeDatabase.get(storeId)

    if (!storeData) {
      return NextResponse.json({ message: "Store not found." }, { status: 404 })
    }

    return NextResponse.json(storeData)
  } catch (error: any) {
    console.error(`API: Error fetching store ${storeId}:`, error)
    return NextResponse.json({ message: "Failed to fetch store data." }, { status: 500 })
  }
}

// Export the store database for use in other routes
export { storeDatabase }
