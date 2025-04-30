import { type NextRequest, NextResponse } from "next/server"
import type { StoreFormData } from "@/types/store"
import { storeDatabase } from "./[storeId]/route"

export async function POST(request: NextRequest) {
  try {
    const storeData: StoreFormData = await request.json()

    if (!storeData) {
      return NextResponse.json({ message: "No store data provided" }, { status: 400 })
    }

    // Validate required fields
    if (!storeData.storeName) {
      return NextResponse.json({ message: "Store name is required" }, { status: 400 })
    }

    console.log("Creating store:", JSON.stringify(storeData, null, 2))

    // Generate a unique store ID
    const newStoreId = `store_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    // Save to our in-memory database
    storeDatabase.set(newStoreId, storeData)

    console.log(`API: Store created successfully with ID: ${newStoreId}`)

    return NextResponse.json({
      message: "Store created successfully!",
      storeId: newStoreId,
    })
  } catch (error) {
    console.error("Error creating store:", error)
    return NextResponse.json({ message: "Failed to create store" }, { status: 500 })
  }
}
