import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const shop = searchParams.get("shop")

  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 })
  }

  // 1) Generate & store a nonce in a cookie
  const state = crypto.randomBytes(16).toString("hex")

  // Set cookie
  const cookieStore = cookies()
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    path: "/",
    maxAge: 600, // 10 minutes
    secure: process.env.NODE_ENV === "production",
  })

  // 2) Redirect to Shopify's OAuth
  const appHost = process.env.APP_HOST || "http://localhost:3000"
  const redirectUri = `${appHost}/api/shopify/callback`
  const scopes =
    process.env.SCOPES ||
    "unauthenticated_read_product_listings,unauthenticated_read_collections,unauthenticated_read_selling_plans"

  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${process.env.SHOPIFY_API_KEY}` + // Removed NEXT_PUBLIC_ prefix
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`

  return NextResponse.redirect(installUrl)
}
