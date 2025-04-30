import { type NextRequest, NextResponse } from "next/server"
import { storeDatabase } from "../../[storeId]/route"

export async function GET(request: NextRequest, { params }: { params: { storeId: string } }) {
  const { storeId } = params
  const searchParams = request.nextUrl.searchParams
  const excludeId = searchParams.get("exclude")
  const limit = Number.parseInt(searchParams.get("limit") || "4", 10)

  if (!storeId) {
    return NextResponse.json({ message: "Store ID is required" }, { status: 400 })
  }

  try {
    // Get the store data
    const storeData = storeDatabase.get(storeId)

    if (!storeData) {
      return NextResponse.json({ message: "Store not found" }, { status: 404 })
    }

    // Filter and limit products
    let products = storeData.products

    if (excludeId) {
      products = products.filter((p) => p.id !== excludeId)
    }

    // Limit the number of products returned
    products = products.slice(0, limit)

    return NextResponse.json({
      products,
      total: products.length,
    })
  } catch (error: any) {
    console.error(`API: Error fetching products from store ${storeId}:`, error)
    return NextResponse.json({ message: "Failed to fetch products data" }, { status: 500 })
  }
}
