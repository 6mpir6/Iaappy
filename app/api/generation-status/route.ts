import { type NextRequest, NextResponse } from "next/server"
import { getGenerationStatus } from "@/actions/generation-status"

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing generation ID" }, { status: 400 })
  }

  try {
    const result = await getGenerationStatus(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching generation status:", error)
    return NextResponse.json({ error: "Failed to fetch generation status" }, { status: 500 })
  }
}
