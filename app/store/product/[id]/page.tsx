"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { products } from "@/data/products"
import { notFound } from "next/navigation"
import { visualizeProduct } from "@/actions/visualize-product"
import type { Product } from "@/types/product"
import RealtimeChat from "@/components/realtime-chat"

export default function ProductPage({ params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Visualization states
  const [userImage, setUserImage] = useState<string | null>(null)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [editPrompt, setEditPrompt] = useState<string>("")
  const [isEditing, setIsEditing] = useState(false)
  const [showImageOptions, setShowImageOptions] = useState(false)
  const [uploadedProductImage, setUploadedProductImage] = useState<string | null>(null)
  const [uploadedProductName, setUploadedProductName] = useState<string>("")

  // Add these new state variables inside the ProductPage component
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [selectedProductForColor, setSelectedProductForColor] = useState<string | null>(null)
  const [productColors, setProductColors] = useState<Record<string, { hex: string; name: string }>>({})

  if (!product) {
    notFound()
  }

  // Initialize with the current product
  useEffect(() => {
    const currentProduct = products.find((p) => p.id === params.id)
    if (currentProduct) {
      setSelectedProducts([currentProduct])
    }
  }, [params.id])

  // Filter products based on search query and category compatibility
  useEffect(() => {
    let filtered = products.filter(
      (p) =>
        // Don't include the current product in search results
        p.id !== params.id &&
        // Filter by search query
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())),
    )

    // For clothing, prioritize other clothing items
    if (getProductType() === "clothing") {
      filtered = filtered.sort((a, b) => {
        const aIsClothing = a.category === "apparel" || a.category === "footwear" || a.category === "accessories"
        const bIsClothing = b.category === "apparel" || b.category === "footwear" || b.category === "accessories"

        if (aIsClothing && !bIsClothing) return -1
        if (!aIsClothing && bIsClothing) return 1
        return 0
      })
    }

    // For home decor, prioritize other home items
    if (getProductType() === "decor") {
      filtered = filtered.sort((a, b) => {
        const aIsDecor = a.category === "home"
        const bIsDecor = b.category === "home"

        if (aIsDecor && !bIsDecor) return -1
        if (!aIsDecor && bIsDecor) return 1
        return 0
      })
    }

    setFilteredProducts(filtered)
  }, [searchQuery, params.id])

  // Determine product type for visualization
  const getProductType = (): "clothing" | "decor" | "other" => {
    if (product.category === "apparel" || product.category === "footwear") {
      return "clothing"
    } else if (product.category === "home") {
      return "decor"
    } else {
      return "other"
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setUserImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setUploadedProductImage(reader.result as string)
      // Set a default name based on the file name
      setUploadedProductName(file.name.split(".")[0].replace(/[_-]/g, " "))

      // Create a custom product from the uploaded image
      const customProduct: Product = {
        id: `custom-${Date.now()}`,
        name: file.name.split(".")[0].replace(/[_-]/g, " "),
        description: "Custom uploaded product",
        price: 0,
        category: getProductType() === "clothing" ? "apparel" : getProductType() === "decor" ? "home" : "accessories",
        imageUrl: reader.result as string,
      }

      // Add the custom product to selected products
      if (selectedProducts.length < 4) {
        setSelectedProducts([...selectedProducts, customProduct])
      }
    }
    reader.readAsDataURL(file)
  }

  // Add this function to handle color selection
  const handleColorSelect = (productId: string, hex: string, name: string) => {
    setProductColors({
      ...productColors,
      [productId]: { hex, name },
    })
    setShowColorPicker(false)
    setSelectedProductForColor(null)
  }

  // Update the handleVisualize function to include color information
  const handleVisualize = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await visualizeProduct({
        products: selectedProducts.map((p) => ({
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          type: getProductType(p.category),
          color: productColors[p.id] || undefined,
        })),
        userImage: userImage || undefined,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setGeneratedImage(result.visualizationUrl)
    } catch (err) {
      console.error("Visualization error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate visualization")
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleUpdateVisualization function to include color information
  const handleUpdateVisualization = async () => {
    if (!editPrompt.trim() && !userImage) return

    setIsEditing(true)
    setError(null)

    try {
      // Use the existing visualization as the starting point
      const updatedProducts = [...selectedProducts]

      const result = await visualizeProduct({
        products: updatedProducts.map((p) => ({
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          type: getProductType(p.category),
          color: productColors[p.id] || undefined,
        })),
        userImage: userImage || undefined,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      setGeneratedImage(result.visualizationUrl)
      setEditPrompt("") // Clear the edit prompt after successful update
    } catch (err) {
      console.error("Visualization update error:", err)
      setError(err instanceof Error ? err.message : "Failed to update visualization")
    } finally {
      setIsEditing(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return

    const a = document.createElement("a")
    a.href = generatedImage
    a.download = `${product.name.replace(/\s+/g, "-").toLowerCase()}-visualization.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const addProduct = (product: Product) => {
    if (selectedProducts.length < 4 && !selectedProducts.some((p) => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product])
    }
  }

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId))
  }

  // Check if a product is already selected
  const isProductSelected = (productId: string) => {
    return selectedProducts.some((p) => p.id === productId)
  }

  // Helper function to determine product type
  const getProductTypeForProduct = (category: string): "clothing" | "decor" | "other" => {
    if (category === "apparel" || category === "footwear" || category === "accessories") {
      return "clothing"
    } else if (category === "home") {
      return "decor"
    } else {
      return "other"
    }
  }

  // Add this function to get color indicator for a product
  const getColorIndicator = (productId: string) => {
    if (productColors[productId]) {
      return (
        <div
          className="absolute bottom-2 right-2 w-4 h-4 rounded-full border border-gray-300"
          style={{ backgroundColor: productColors[productId].hex }}
          title={`Color: ${productColors[productId].name}`}
        />
      )
    }
    return null
  }

  // Add this predefined color palette array after the ProductPage function declaration
  const colorPalette = [
    { hex: "#000000", name: "Black" },
    { hex: "#FFFFFF", name: "White" },
    { hex: "#FF0000", name: "Red" },
    { hex: "#0000FF", name: "Blue" },
    { hex: "#008000", name: "Green" },
    { hex: "#FFFF00", name: "Yellow" },
    { hex: "#FFA500", name: "Orange" },
    { hex: "#800080", name: "Purple" },
    { hex: "#FFC0CB", name: "Pink" },
    { hex: "#A52A2A", name: "Brown" },
    { hex: "#808080", name: "Gray" },
    { hex: "#C0C0C0", name: "Silver" },
    { hex: "#FFD700", name: "Gold" },
    { hex: "#00FFFF", name: "Cyan" },
    { hex: "#FF00FF", name: "Magenta" },
  ]

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-gray-900 dark:bg-black text-white dark:text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-normal uppercase tracking-wider">StyleHub</h1>
            <nav className="hidden md:flex space-x-6">
              <a
                href="/store"
                className="hover:underline underline-offset-4 transition uppercase text-sm tracking-wider"
              >
                Home
              </a>
              <a
                href="/store#apparel"
                className="hover:underline underline-offset-4 transition uppercase text-sm tracking-wider"
              >
                Apparel
              </a>
              <a
                href="/store#footwear"
                className="hover:underline underline-offset-4 transition uppercase text-sm tracking-wider"
              >
                Footwear
              </a>
              <a
                href="/store#accessories"
                className="hover:underline underline-offset-4 transition uppercase text-sm tracking-wider"
              >
                Accessories
              </a>
              <a
                href="/store#home"
                className="hover:underline underline-offset-4 transition uppercase text-sm tracking-wider"
              >
                Home
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <button aria-label="Search" className="md:hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              <button aria-label="Cart" className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="absolute -top-2 -right-2 bg-white text-black text-xs w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>
              <button aria-label="Account">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center text-sm">
            <a href="/store" className="hover:underline underline-offset-4 transition uppercase text-xs tracking-wider">
              Home
            </a>
            <span className="mx-2">/</span>
            <a
              href={`/store#${product.category.toLowerCase()}`}
              className="hover:underline underline-offset-4 transition uppercase text-xs tracking-wider capitalize"
            >
              {product.category}
            </a>
            <span className="mx-2">/</span>
            <span className="text-black dark:text-white uppercase text-xs tracking-wider">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <img
                  src={product.imageUrl || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button className="bg-gray-100 dark:bg-gray-800 overflow-hidden border border-black dark:border-gray-700">
                  <img
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={`${product.name} thumbnail 1`}
                    className="w-full h-24 object-cover"
                  />
                </button>
                <button className="bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img
                    src="/placeholder.svg?height=100&width=100&text=View+2"
                    alt={`${product.name} thumbnail 2`}
                    className="w-full h-24 object-cover"
                  />
                </button>
                <button className="bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img
                    src="/placeholder.svg?height=100&width=100&text=View+3"
                    alt={`${product.name} thumbnail 3`}
                    className="w-full h-24 object-cover"
                  />
                </button>
                <button className="bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img
                    src="/placeholder.svg?height=100&width=100&text=View+4"
                    alt={`${product.name} thumbnail 4`}
                    className="w-full h-24 object-cover"
                  />
                </button>
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-6">
                {product.badge && (
                  <span className="inline-block px-3 py-1 text-xs uppercase tracking-wider text-white bg-black mb-2">
                    {product.badge}
                  </span>
                )}
                <h1 className="text-3xl font-normal uppercase tracking-wider mb-2">{product.name}</h1>
                <div className="flex items-center mb-2">
                  <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 ml-2">4.9 (128 reviews)</span>
                </div>
                <p className="text-2xl font-normal">${product.price.toFixed(2)}</p>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              {/* Options */}
              {product.colors && (
                <div className="mb-6">
                  <h3 className="text-sm uppercase tracking-wider text-gray-700 mb-2">Color</h3>
                  <div className="flex space-x-2">
                    {product.colors.map((color, index) => (
                      <button
                        key={color}
                        className={`w-10 h-10 ${index === 0 ? "border-2 border-black" : "border border-gray-300"}`}
                        style={{
                          backgroundColor: color.toLowerCase().includes("emerald")
                            ? "#10b981"
                            : color.toLowerCase().includes("navy")
                              ? "#1e40af"
                              : color.toLowerCase().includes("rose")
                                ? "#be185d"
                                : color.toLowerCase().includes("gray")
                                  ? "#4b5563"
                                  : "#e5e7eb",
                        }}
                        aria-label={color}
                      ></button>
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm uppercase tracking-wider text-gray-700">Size</h3>
                    <a href="#" className="text-sm uppercase tracking-wider text-blue-600">
                      Size Guide
                    </a>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {product.sizes.map((size, index) => (
                      <button
                        key={size}
                        className={`border py-2 text-sm uppercase tracking-wider ${
                          index === 1
                            ? "border-black bg-black text-white"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to Cart */}
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center border border-gray-300">
                    <button className="px-4 py-2 text-gray-700 hover:bg-gray-100">-</button>
                    <span className="px-4 py-2">1</span>
                    <button className="px-4 py-2 text-gray-700 hover:bg-gray-100">+</button>
                  </div>
                  <button className="flex-1 bg-blue-600 text-white py-3 px-6 hover:bg-blue-700 transition uppercase tracking-wider text-sm">
                    Add to Cart
                  </button>
                </div>
                <button className="w-full border border-gray-300 text-gray-700 py-3 hover:bg-gray-50 transition uppercase tracking-wider text-sm flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  Add to Wishlist
                </button>
              </div>

              {/* Product Details */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg uppercase tracking-wider font-normal mb-4">Product Details</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  {product.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              </div>

              {/* Shipping Info */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Free shipping on orders over $50</span>
                </div>
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>30-day easy returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl uppercase tracking-wider font-normal mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {products
              .filter((p) => p.category === product.category && p.id !== product.id)
              .slice(0, 4)
              .map((relatedProduct) => (
                <div key={relatedProduct.id} className="bg-white overflow-hidden group">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={relatedProduct.imageUrl || "/placeholder.svg"}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {relatedProduct.badge && (
                      <div className="absolute top-0 left-0 bg-black text-white text-xs uppercase tracking-wider px-2 py-1">
                        {relatedProduct.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-normal text-black mb-1 uppercase tracking-wider text-sm">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{relatedProduct.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-normal">${relatedProduct.price.toFixed(2)}</span>
                      <a
                        href={`/store/product/${relatedProduct.id}`}
                        className="text-blue-600 text-sm uppercase tracking-wider hover:underline underline-offset-4"
                      >
                        View Product
                      </a>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Add Realtime Chat */}
      <RealtimeChat />
    </main>
  )
}
