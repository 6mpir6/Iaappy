export interface ShopRecord {
  shop: string
  storefrontToken: string
}

export async function fetchShopifyProducts(shopRec: ShopRecord) {
  const PRODUCTS_QUERY = `#graphql
    query getFirstTen {
      products(first: 10) {
        edges {
          node { 
            id 
            title 
            handle 
            description
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            images(first: 1) { 
              edges { 
                node { 
                  url 
                  altText
                } 
              } 
            }
          }
        }
      }
    }
  `

  const apiVersion = process.env.API_VERSION || "2025-04"

  const res = await fetch(`https://${shopRec.shop}/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": shopRec.storefrontToken,
    },
    body: JSON.stringify({ query: PRODUCTS_QUERY }),
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.statusText}`)
  }

  const { data, errors } = await res.json()

  if (errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`)
  }

  return data.products.edges.map((e) => ({
    id: e.node.id,
    title: e.node.title,
    handle: e.node.handle,
    description: e.node.description,
    price: e.node.priceRange.minVariantPrice.amount,
    currency: e.node.priceRange.minVariantPrice.currencyCode,
    imageUrl: e.node.images.edges[0]?.node.url || null,
    imageAlt: e.node.images.edges[0]?.node.altText || e.node.title,
  }))
}
