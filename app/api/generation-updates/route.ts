import { type NextRequest, NextResponse } from "next/server"
import { getGenerationUpdates } from "@/actions/generation-updates"

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing generation ID" }, { status: 400 })
  }

  try {
    const result = await getGenerationUpdates(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching generation updates:", error)
    return NextResponse.json({ statusMessages: [], imagePreviewsUrls: [], isComplete: false }, { status: 500 })
  }
}
