"use server"

/**
 * Server action to initiate Shopify OAuth flow
 * This keeps the API key secure by handling the redirect on the server
 */
export async function connectShopifyStore(shop: string) {
  if (!shop) {
    throw new Error("Shop domain is required")
  }

  // Clean up the shop domain if needed
  let shopDomain = shop
  if (!shopDomain.includes(".myshopify.com")) {
    shopDomain = `${shopDomain}.myshopify.com`
  }

  // Return the URL that the client should redirect to
  return `/api/shopify/auth?shop=${encodeURIComponent(shopDomain)}`
}
