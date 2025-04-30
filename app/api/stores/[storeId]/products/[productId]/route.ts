import { type NextRequest, NextResponse } from "next/server"
import { storeDatabase } from "../../../[storeId]/route"

export async function GET(request: NextRequest, { params }: { params: { storeId: string; productId: string } }) {
  const { storeId, productId } = params

  if (!storeId || !productId) {
    return NextResponse.json({ message: "Store ID and Product ID are required" }, { status: 400 })
  }

  try {
    // Get the store data
    const storeData = storeDatabase.get(storeId)

    if (!storeData) {
      return NextResponse.json({ message: "Store not found" }, { status: 404 })
    }

    // Find the specific product
    const product = storeData.products.find((p) => p.id === productId)

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    // Return the product with store information
    return NextResponse.json({
      ...product,
      storeId,
      storeName: storeData.storeName,
      theme: storeData.theme,
    })
  } catch (error: any) {
    console.error(`API: Error fetching product ${productId} from store ${storeId}:`, error)
    return NextResponse.json({ message: "Failed to fetch product data" }, { status: 500 })
  }
}
