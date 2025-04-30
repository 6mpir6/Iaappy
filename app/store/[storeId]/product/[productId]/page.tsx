"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { type ProductRow, availableThemes } from "@/types/store"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Heart, Share2, ArrowLeft, Star } from "lucide-react"

interface ProductData extends ProductRow {
  storeId: string
  storeName: string
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { storeId, productId } = params

  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [relatedProducts, setRelatedProducts] = useState<ProductRow[]>([])

  // Fetch product data
  useEffect(() => {
    if (!storeId || !productId) {
      setError("Invalid product or store ID")
      setLoading(false)
      return
    }

    async function fetchProductData() {
      try {
        // Fetch the specific product
        const response = await fetch(`/api/stores/${storeId}/products/${productId}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Product not found")
          }
          throw new Error(`Error fetching product: ${response.statusText}`)
        }

        const data = await response.json()
        setProduct(data)

        // Fetch related products from the same store
        const relatedResponse = await fetch(`/api/stores/${storeId}/products?exclude=${productId}&limit=4`)
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json()
          setRelatedProducts(relatedData.products || [])
        }
      } catch (err: any) {
        console.error("Failed to fetch product:", err)
        setError(err.message || "Failed to load product")
      } finally {
        setLoading(false)
      }
    }

    fetchProductData()
  }, [storeId, productId])

  // Apply theme styles
  useEffect(() => {
    if (product?.theme) {
      const theme = availableThemes.find((t) => t.name === product.theme)
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
  }, [product?.theme])

  // Helper to check if URL is likely a data URL
  const isDataUrl = (url: string) => url?.startsWith("data:image")

  // Handle quantity changes
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const increaseQuantity = () => {
    setQuantity(quantity + 1)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[color:var(--primary-color)]"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 dark:bg-red-900/20 p-4">
        <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Go Back
        </Button>
      </div>
    )
  }

  // Not found state
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push(`/store/${storeId}`)} className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to Store
        </Button>
      </div>
    )
  }

  // Format price with 2 decimal places
  const formattedPrice =
    typeof product.price === "number" ? product.price.toFixed(2) : Number.parseFloat(product.price).toFixed(2)

  // Prepare image URLs (handle both single imageUrl and multiple imageUrls if available)
  const imageUrls = product.imageUrls
    ? Array.isArray(product.imageUrls)
      ? product.imageUrls
      : [product.imageUrls]
    : product.imageUrl
      ? [product.imageUrl]
      : []

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Back to store link */}
      <div className="container mx-auto px-4 py-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/store/${storeId}`)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to {product.storeName || "Store"}
        </Button>
      </div>

      {/* Product Detail */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-[var(--border-radius)] overflow-hidden aspect-square">
              <img
                src={imageUrls[activeImageIndex] || "/placeholder.svg?height=600&width=600&text=No+Image"}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Thumbnail Gallery */}
            {imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`bg-gray-100 dark:bg-gray-800 rounded-[var(--border-radius)] overflow-hidden border-2 ${
                      index === activeImageIndex ? "border-[color:var(--primary-color)]" : "border-transparent"
                    }`}
                  >
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`${product.title} thumbnail ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{product.title}</h1>

            {/* Price */}
            <div className="text-2xl font-semibold text-[color:var(--primary-color)] mb-4">${formattedPrice}</div>

            {/* Rating Stars (placeholder) */}
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">(12 reviews)</span>
            </div>

            {/* Description */}
            <p className="text-gray-700 dark:text-gray-300 mb-6">{product.description}</p>

            {/* Quantity Selector */}
            <div className="flex items-center mb-6">
              <span className="mr-4 text-gray-700 dark:text-gray-300">Quantity:</span>
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                <button
                  onClick={decreaseQuantity}
                  className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  -
                </button>
                <span className="px-4 py-1 text-center w-12">{quantity}</span>
                <button
                  onClick={increaseQuantity}
                  className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Button className="flex-1 gap-2 bg-[color:var(--primary-color)] hover:bg-[color:var(--primary-color)]/90">
                <ShoppingCart size={18} />
                Add to Cart
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                <Heart size={18} />
                Add to Wishlist
              </Button>
            </div>

            {/* Share */}
            <Button variant="ghost" className="self-start gap-2 text-gray-600 dark:text-gray-400">
              <Share2 size={18} />
              Share Product
            </Button>

            {/* Additional Info */}
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Product Details</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                <li>SKU: {productId}</li>
                <li>In stock: Yes</li>
                <li>Shipping: 2-3 business days</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="bg-white dark:bg-gray-900 rounded-[var(--border-radius)] shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                    <img
                      src={relatedProduct.imageUrl || "/placeholder.svg"}
                      alt={relatedProduct.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">{relatedProduct.title}</h3>
                    <p className="text-[color:var(--primary-color)] font-medium">
                      ${Number.parseFloat(relatedProduct.price).toFixed(2)}
                    </p>
                    <Button
                      variant="link"
                      className="p-0 h-auto mt-2 text-[color:var(--primary-color)]"
                      onClick={() => router.push(`/store/${storeId}/product/${relatedProduct.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add global style for text glow if using class toggle */}
      <style jsx global>{`
        body.text-glow-enabled .text-shadow-glow {
          text-shadow: 0 0 5px var(--primary-color), 0 0 8px var(--primary-color);
        }
      `}</style>
    </main>
  )
}
