"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, CreditCard, Truck, CheckCircle, ShoppingBag, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

// Define the checkout steps
type CheckoutStep = "cart" | "shipping" | "payment" | "confirmation"

// Sample cart item type
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  size?: string
  color?: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart")
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string>("")

  // Sample cart items - in a real app, this would come from a cart context or API
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
    },
  ])

  // Form state
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    phone: "",
  })

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    saveCard: false,
  })

  // Shipping options
  const shippingOptions = [
    { id: "standard", name: "Standard Shipping", price: 5.99, days: "3-5" },
    { id: "express", name: "Express Shipping", price: 12.99, days: "1-2" },
    { id: "free", name: "Free Shipping", price: 0, days: "5-7" },
  ]

  const [selectedShipping, setSelectedShipping] = useState(shippingOptions[0].id)

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const shippingCost = shippingOptions.find((option) => option.id === selectedShipping)?.price || 0
  const taxRate = 0.08 // 8% tax rate
  const tax = subtotal * taxRate
  const total = subtotal + shippingCost + tax

  // Handle form input changes
  const handleShippingInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setShippingInfo((prev) => ({ ...prev, [name]: value }))
  }

  const handlePaymentInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setPaymentInfo((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  // Handle shipping option selection
  const handleShippingOptionChange = (id: string) => {
    setSelectedShipping(id)
  }

  // Handle quantity changes
  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  // Remove item from cart
  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Navigate to next step
  const nextStep = () => {
    switch (currentStep) {
      case "cart":
        setCurrentStep("shipping")
        break
      case "shipping":
        setCurrentStep("payment")
        break
      case "payment":
        processOrder()
        break
      default:
        break
    }
  }

  // Navigate to previous step
  const prevStep = () => {
    switch (currentStep) {
      case "shipping":
        setCurrentStep("cart")
        break
      case "payment":
        setCurrentStep("shipping")
        break
      case "confirmation":
        router.push("/store")
        break
      default:
        break
    }
  }

  // Process the order
  const processOrder = async () => {
    setIsProcessing(true)

    try {
      // In a real app, this would be an API call to process the payment and create the order
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call

      // Generate a random order number
      const orderNum = `ORD-${Math.floor(100000 + Math.random() * 900000)}`
      setOrderNumber(orderNum)

      // Clear cart and move to confirmation
      setCurrentStep("confirmation")
    } catch (error) {
      console.error("Error processing order:", error)
      // Handle error (show error message, etc.)
    } finally {
      setIsProcessing(false)
    }
  }

  // Check if form is valid for current step
  const isCurrentStepValid = () => {
    switch (currentStep) {
      case "cart":
        return cartItems.length > 0
      case "shipping":
        return Object.values(shippingInfo).every((val) => val !== "")
      case "payment":
        return (
          paymentInfo.cardNumber.length >= 16 &&
          paymentInfo.cardName !== "" &&
          paymentInfo.expiryDate !== "" &&
          paymentInfo.cvv.length >= 3
        )
      default:
        return true
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              {currentStep === "confirmation" ? "Return to Shop" : "Back"}
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {currentStep === "cart" && "Your Cart"}
              {currentStep === "shipping" && "Shipping Information"}
              {currentStep === "payment" && "Payment Details"}
              {currentStep === "confirmation" && "Order Confirmation"}
            </h1>
            <div className="w-24"></div> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {currentStep !== "confirmation" && (
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto mb-8">
            <div
              className={`flex flex-col items-center ${currentStep === "cart" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === "cart" ? "bg-emerald-100 dark:bg-emerald-900" : "bg-gray-100 dark:bg-gray-800"}`}
              >
                <ShoppingBag className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">Cart</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2"></div>
            <div
              className={`flex flex-col items-center ${currentStep === "shipping" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === "shipping" ? "bg-emerald-100 dark:bg-emerald-900" : "bg-gray-100 dark:bg-gray-800"}`}
              >
                <Truck className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">Shipping</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2"></div>
            <div
              className={`flex flex-col items-center ${currentStep === "payment" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep === "payment" ? "bg-emerald-100 dark:bg-emerald-900" : "bg-gray-100 dark:bg-gray-800"}`}
              >
                <CreditCard className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">Payment</span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Cart Step */}
        {currentStep === "cart" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Shopping Cart ({cartItems.length} items)</h2>

                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">Your cart is empty</p>
                    <Button onClick={() => router.push("/store")} className="mt-4">
                      Continue Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {cartItems.map((item) => (
                      <div key={item.id} className="py-4 flex flex-col sm:flex-row">
                        <div className="sm:w-24 h-24 mb-4 sm:mb-0 flex-shrink-0">
                          <img
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                        <div className="flex-1 sm:ml-4">
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">{item.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {item.size && `Size: ${item.size}`}
                                {item.size && item.color && " | "}
                                {item.color && `Color: ${item.color}`}
                              </p>
                            </div>
                            <p className="font-medium text-gray-900 dark:text-white mt-2 sm:mt-0">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-4">
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
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3">
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
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={nextStep}
                  disabled={!isCurrentStepValid()}
                  className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700"
                >
                  Proceed to Shipping
                </Button>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => router.push("/store")}
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Step */}
        {currentStep === "shipping" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={shippingInfo.firstName}
                      onChange={handleShippingInfoChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={shippingInfo.lastName}
                      onChange={handleShippingInfoChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={shippingInfo.email}
                      onChange={handleShippingInfoChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleShippingInfoChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleShippingInfoChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleShippingInfoChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={shippingInfo.state}
                      onChange={handleShippingInfoChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={shippingInfo.zipCode}
                      onChange={handleShippingInfoChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                    <select
                      name="country"
                      value={shippingInfo.country}
                      onChange={handleShippingInfoChange}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                    </select>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mt-8 mb-4">Shipping Method</h3>
                <div className="space-y-3">
                  {shippingOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center justify-between p-3 border rounded-md cursor-pointer ${
                        selectedShipping === option.id
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="shippingOption"
                          value={option.id}
                          checked={selectedShipping === option.id}
                          onChange={() => handleShippingOptionChange(option.id)}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="ml-3">
                          <p className="font-medium text-gray-900 dark:text-white">{option.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Delivery in {option.days} business days
                          </p>
                        </div>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {option.price === 0 ? "Free" : `$${option.price.toFixed(2)}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3">
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
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <Button
                    onClick={nextStep}
                    disabled={!isCurrentStepValid()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    Continue to Payment
                  </Button>

                  <Button onClick={prevStep} variant="outline" className="w-full">
                    Back to Cart
                  </Button>
                </div>

                <div className="mt-6 space-y-2">
                  <h3 className="font-medium text-sm">Order Items ({cartItems.length})</h3>
                  <div className="max-h-40 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center py-2">
                        <div className="w-10 h-10 flex-shrink-0">
                          <img
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Step */}
        {currentStep === "payment" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Payment Method</h2>
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <Lock className="h-4 w-4 mr-1" />
                    <span className="text-xs">Secure Payment</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                      <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none">
                        <rect width="48" height="32" rx="4" fill="#1434CB" />
                        <path d="M18 10L15 22H19L22 10H18Z" fill="white" />
                        <path
                          d="M33 10C31.3 10 30 11 29.5 12.5C28 17 32 17 30.5 19.5C30 20.5 29 21 27.5 21C26 21 25 20.5 25 20.5L24.5 23.5C24.5 23.5 26 24 28 24C30 24 32.5 23 33.5 20C35 16 31 16 32.5 13.5C33 12.5 34 12 35.5 12C37 12 38 12.5 38 12.5L38.5 9.5C38.5 9.5 37 9 35 9C33 9 31.5 10 31.5 10H33Z"
                          fill="white"
                        />
                        <path
                          d="M10 9C7 9 4 10 4 10L3.5 13C3.5 13 6.5 12 8.5 12C9.5 12 10 12.5 10 13C10 13.5 9.5 14 8.5 14H6.5L6 17H8C9 17 9.5 17.5 9.5 18C9.5 19 8.5 20 7 20C5 20 4 19 4 19L3.5 22C3.5 22 5 23 8 23C11 23 13 21 13.5 18.5C14 16 12 15 12 13.5C12 11 14 10 16 10H17L18 7H15C12 7 10 9 10 9Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                      <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none">
                        <rect width="48" height="32" rx="4" fill="#FF5F00" />
                        <circle cx="16" cy="16" r="10" fill="#EB001B" />
                        <circle cx="32" cy="16" r="10" fill="#F79E1B" />
                        <path d="M24 8V24" stroke="white" strokeWidth="2" />
                      </svg>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                      <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none">
                        <rect width="48" height="32" rx="4" fill="#006FCF" />
                        <path d="M24 10L27 16H21L24 10Z" fill="white" />
                        <path d="M24 22L21 16H27L24 22Z" fill="white" />
                        <path d="M13 13H10V19H13V13Z" fill="white" />
                        <path d="M38 13H35V19H38V13Z" fill="white" />
                      </svg>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded p-2">
                      <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none">
                        <rect width="48" height="32" rx="4" fill="#003087" />
                        <path d="M18 13H15V19H18V13Z" fill="white" />
                        <path
                          d="M33 13C33 13 31 12 29 12C27 12 26 13 26 14C26 15 27 16 29 16C31 16 33 17 33 19C33 21 31 22 29 22C27 22 25 21 25 21V18C25 18 27 19 29 19C31 19 30 17 28 17C26 17 23 16 23 13C23 10 26 9 29 9C31 9 33 10 33 10V13Z"
                          fill="white"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={paymentInfo.cardNumber}
                        onChange={handlePaymentInfoChange}
                        placeholder="1234 5678 9012 3456"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        maxLength={19}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        name="cardName"
                        value={paymentInfo.cardName}
                        onChange={handlePaymentInfoChange}
                        placeholder="John Doe"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={paymentInfo.expiryDate}
                          onChange={handlePaymentInfoChange}
                          placeholder="MM/YY"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          maxLength={5}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CVV</label>
                        <input
                          type="text"
                          name="cvv"
                          value={paymentInfo.cvv}
                          onChange={handlePaymentInfoChange}
                          placeholder="123"
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="saveCard"
                        name="saveCard"
                        checked={paymentInfo.saveCard}
                        onChange={handlePaymentInfoChange}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label htmlFor="saveCard" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Save card for future purchases
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold mb-4">Billing Address</h3>

                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="sameAsShipping"
                      checked={true}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor="sameAsShipping" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Same as shipping address
                    </label>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {shippingInfo.firstName} {shippingInfo.lastName}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{shippingInfo.address}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{shippingInfo.country}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3">
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
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <Button
                    onClick={nextStep}
                    disabled={!isCurrentStepValid() || isProcessing}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>Place Order</>
                    )}
                  </Button>

                  <Button onClick={prevStep} variant="outline" className="w-full" disabled={isProcessing}>
                    Back to Shipping
                  </Button>
                </div>

                <div className="mt-6 space-y-2">
                  <h3 className="font-medium text-sm">Shipping to:</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      {shippingInfo.firstName} {shippingInfo.lastName}
                    </p>
                    <p>{shippingInfo.address}</p>
                    <p>
                      {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
                    </p>
                    <p>{shippingInfo.country}</p>
                  </div>

                  <h3 className="font-medium text-sm pt-2">Shipping Method:</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {shippingOptions.find((option) => option.id === selectedShipping)?.name} -
                    {shippingOptions.find((option) => option.id === selectedShipping)?.price === 0
                      ? " Free"
                      : ` $${shippingOptions.find((option) => option.id === selectedShipping)?.price.toFixed(2)}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Step */}
        {currentStep === "confirmation" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You For Your Order!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your order has been placed and is being processed.
              </p>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-4 mb-6 inline-block">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Order Number: <span className="font-bold">{orderNumber}</span>
                </p>
              </div>

              <div className="text-left mb-8">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order Details</h3>
                <div className="space-y-4">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Items</h4>
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center py-2">
                        <div className="w-12 h-12 flex-shrink-0">
                          <img
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Qty: {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Shipping Information</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        {shippingInfo.firstName} {shippingInfo.lastName}
                      </p>
                      <p>{shippingInfo.address}</p>
                      <p>
                        {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
                      </p>
                      <p>{shippingInfo.country}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Payment Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                        <span>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Tax</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-2">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button onClick={() => router.push("/store")} className="bg-emerald-600 hover:bg-emerald-700">
                  Continue Shopping
                </Button>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  A confirmation email has been sent to {shippingInfo.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
