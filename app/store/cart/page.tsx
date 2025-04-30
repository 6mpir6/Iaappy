"use client"

import { useState } from "react"
import { ShoppingCart } from "lucide-react"
import { CheckoutButton } from "@/components/checkout-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface CartItem {
  id: string
  name: string
  imageUrl: string
  price: number
  quantity: number
  size?: string
  color?: string
  category: string
}

export default function CartPage() {
  const [visualizationModalOpen, setVisualizationModalOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "nike-air-max",
      name: "Nike Air Max Nuaxis",
      imageUrl:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Nike%20Air%20Max%20Nuaxis.jpg-QZjb3wNhRXllOM8owGO0DRnWCJ1n0p.jpeg",
      price: 129.99,
      quantity: 1,
      size: "10",
      color: "White/Red",
      category: "footwear",
    },
    {
      id: "outworked-hoodie",
      name: "I Outworked You Hoodie",
      imageUrl:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/I%20Outworked%20You%20Hoodie%202.jpg-irrr9cRt2Ksk3iRdJCajlGv6X2uSoz.jpeg",
      price: 65.0,
      quantity: 1,
      size: "L",
      color: "Black",
      category: "apparel",
    },
    {
      id: "airpods-case",
      name: "Rubber Case for AirPods®",
      imageUrl:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Rubber%20Case%20for%20AirPods.jpg-QOQzs7XnmwRvScuapkv7gJvsqvUdV2.jpeg",
      price: 24.0,
      quantity: 1,
      color: "Black",
      category: "accessories",
    },
  ])

  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const shippingCost = 0 // Assuming free shipping for now
  const taxRate = 0.08 // 8% tax rate
  const tax = subtotal * taxRate
  const total = subtotal + shippingCost + tax

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Your Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Your cart is empty</p>
            <Button onClick={() => (window.location.href = "/store")} className="mt-4">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Cart Items</CardTitle>
                  <CardDescription>Manage the items in your cart</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-20 h-20 mr-4 rounded-md overflow-hidden shadow">
                          <img
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {item.size && `Size: ${item.size}`}
                            {item.size && item.color && " | "}
                            {item.color && `Color: ${item.color}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            -
                          </button>
                          <span className="px-3 py-1">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            +
                          </button>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>Total items: {cartItems.length}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                    <span className="font-medium">{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax (8%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <CheckoutButton
                    hasItems={cartItems.length > 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  />
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
