"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { type StoreFormData, type ProductRow, availableThemes } from "@/types/store"

// Define the expected shape of store data fetched from the API
interface FetchedStoreData extends Omit<StoreFormData, "products"> {
  storeId: string
  createdAt?: string
  products: ProductRow[]
}

export default function StorePage() {
  const params = useParams()
  const storeId = params?.storeId as string

  const [store, setStore] = useState<FetchedStoreData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!storeId) {
      setError("Store ID is required")
      setLoading(false)
      return
    }

    async function fetchStore() {
      try {
        const response = await fetch(`/api/stores/${storeId}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Store not found")
          }
          throw new Error(`Error fetching store: ${response.statusText}`)
        }

        const data = await response.json()
        setStore({
          ...data,
          storeId,
        })
      } catch (err: any) {
        console.error("Failed to fetch store:", err)
        setError(err.message || "Failed to load store")
      } finally {
        setLoading(false)
      }
    }

    fetchStore()
  }, [storeId])

  // Apply theme styles
  useEffect(() => {
    if (store?.theme) {
      const theme = availableThemes.find((t) => t.name === store.theme)
      const root = document.documentElement
      if (theme && root) {
        root.style.setProperty("--primary-color", theme.styles.primaryColor)
        root.style.setProperty("--secondary-color", theme.styles.secondaryColor)
        root.style.setProperty("--border-radius", theme.styles.borderRadius)

        if (theme.styles.textGlow) {
          document.body.classList.add("text-glow-enabled")
        } else {
          document.body.classList.remove("text-glow-enabled")
        }
      }
    }

    return () => {
      document.body.classList.remove("text-glow-enabled")
    }
  }, [store?.theme])

  // Helper to check if URL is likely a data URL
  const isDataUrl = (url: string) => url?.startsWith("data:image")

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[color:var(--primary-color)]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-red-900">
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Store not found.</p>
      </div>
    )
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      {/* Store Header */}
      <header className="mb-8 text-center">
        {store.logoUrl && (
          <img
            src={store.logoUrl || "/placeholder.svg"}
            alt={`${store.storeName} Logo`}
            className={`h-20 md:h-24 mx-auto mb-4 object-contain ${isDataUrl(store.logoUrl) ? "max-w-xs" : ""}`}
          />
        )}
        <h1
          className={`text-3xl md:text-4xl font-bold mb-2 text-[color:var(--primary-color)] ${store.theme && availableThemes.find((t) => t.name === store.theme)?.styles.textGlow ? "text-shadow-glow" : ""}`}
        >
          {store.storeName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{store.storeDescription}</p>
      </header>

      {/* Products Grid */}
      <section>
        <h2 className="text-2xl font-semibold mb-6 text-center md:text-left text-[color:var(--secondary-color)]">
          Products
        </h2>
        {store.products && store.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {store.products.map((product) => (
              <div
                key={product.id}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[var(--border-radius)] p-4 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
                onClick={() => (window.location.href = `/store/${storeId}/product/${product.id}`)}
                style={{ cursor: "pointer" }}
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.title || "Product Image"}
                    className="w-full h-48 object-cover mb-3 rounded-[var(--border-radius)] border border-gray-100 dark:border-gray-600"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 mb-3 rounded-[var(--border-radius)] flex items-center justify-center text-gray-400 dark:text-gray-500">
                    No Image
                  </div>
                )}
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-[color:var(--primary-color)] transition-colors">
                    {product.title || "Untitled Product"}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">{product.description}</p>
                  )}
                </div>
                {product.price && (
                  <p className="text-lg font-bold mt-3 text-[color:var(--primary-color)]">
                    $
                    {typeof product.price === "number"
                      ? product.price.toFixed(2)
                      : Number.parseFloat(product.price).toFixed(2)}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">No products found for this store.</p>
        )}
      </section>

      {/* Add global style for text glow if using class toggle */}
      <style jsx global>{`
        body.text-glow-enabled .text-shadow-glow {
          text-shadow: 0 0 5px var(--primary-color), 0 0 8px var(--primary-color);
        }
      `}</style>
    </main>
  )
}
