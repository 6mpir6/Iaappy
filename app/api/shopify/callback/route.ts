import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"

// Mock database for demo purposes
const shopDatabase = new Map()

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const shop = searchParams.get("shop")
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  // Get the stored state from cookie
  const cookieStore = cookies()
  const storedState = cookieStore.get("oauth_state")?.value

  if (!shop || !code || state !== storedState) {
    return NextResponse.json({ error: "OAuth validation failed" }, { status: 400 })
  }

  try {
    // 1) Exchange code for Admin access token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY, // Removed NEXT_PUBLIC_ prefix
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    })

    if (!tokenRes.ok) {
      throw new Error(`Failed to exchange token: ${tokenRes.statusText}`)
    }

    const tokenData = await tokenRes.json()
    const adminToken = tokenData.access_token

    // TODO: Persist { shop, adminToken } in your database
    // For demo, we'll use an in-memory store
    shopDatabase.set(shop, { adminToken })
    console.log(`Stored admin token for ${shop}`)

    // 2) Create a Storefront access token via Admin GraphQL API
    const apiVersion = process.env.API_VERSION || "2025-04"
    const storefrontMutation = `
      mutation storefrontAccessTokenCreate($title: String!) {
        storefrontAccessTokenCreate(input: { title: $title }) {
          storefrontAccessToken { accessToken }
          userErrors { field message }
        }
      }
    `

    const storefrontRes = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminToken,
      },
      body: JSON.stringify({
        query: storefrontMutation,
        variables: { title: `Headless App Token – ${crypto.randomBytes(4).toString("hex")}` },
      }),
    })

    if (!storefrontRes.ok) {
      throw new Error(`Failed to create storefront token: ${storefrontRes.statusText}`)
    }

    const sfData = await storefrontRes.json()

    if (sfData.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(sfData.errors)}`)
    }

    if (sfData.data?.storefrontAccessTokenCreate?.userErrors?.length) {
      throw new Error(`User errors: ${JSON.stringify(sfData.data.storefrontAccessTokenCreate.userErrors)}`)
    }

    const sfToken = sfData.data.storefrontAccessTokenCreate.storefrontAccessToken.accessToken

    // TODO: Persist storefront token alongside the shop record
    // For demo, we'll update our in-memory store
    shopDatabase.set(shop, {
      ...shopDatabase.get(shop),
      storefrontToken: sfToken,
    })
    console.log(`Stored storefront token for ${shop}`)

    // Clear OAuth cookie
    cookieStore.set("oauth_state", "", { maxAge: 0, path: "/" })

    // Redirect to the dashboard or next step in your wizard
    return NextResponse.redirect(new URL("/store", request.url))
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.json({ error: `Authentication failed: ${error.message}` }, { status: 500 })
  }
}
