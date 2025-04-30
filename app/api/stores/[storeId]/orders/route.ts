import { type NextRequest, NextResponse } from "next/server"
import type { Order } from "@/types/order"

// In-memory store for demo purposes
const orderDatabase: Map<string, Order[]> = new Map()

export async function POST(request: NextRequest, { params }: { params: { storeId: string } }) {
  const storeId = params.storeId

  if (!storeId) {
    return NextResponse.json({ message: "Store ID is required" }, { status: 400 })
  }

  try {
    const orderData = await request.json()

    // Generate a unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Generate a readable order number
    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`

    // Create the order object
    const order: Order = {
      id: orderId,
      storeId,
      orderNumber,
      items: orderData.items,
      shippingInfo: orderData.shippingInfo,
      paymentInfo: {
        lastFour: orderData.paymentInfo.cardNumber.slice(-4),
        cardType: "Credit Card", // In a real app, detect card type
      },
      subtotal: orderData.subtotal,
      shipping: orderData.shipping,
      tax: orderData.tax,
      total: orderData.total,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Store the order
    if (!orderDatabase.has(storeId)) {
      orderDatabase.set(storeId, [])
    }

    orderDatabase.get(storeId)?.push(order)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    })
  } catch (error: any) {
    console.error(`API: Error creating order for store ${storeId}:`, error)
    return NextResponse.json({ message: "Failed to create order" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { storeId: string } }) {
  const storeId = params.storeId
  const searchParams = request.nextUrl.searchParams
  const orderId = searchParams.get("orderId")

  if (!storeId) {
    return NextResponse.json({ message: "Store ID is required" }, { status: 400 })
  }

  try {
    const storeOrders = orderDatabase.get(storeId) || []

    if (orderId) {
      // Return a specific order
      const order = storeOrders.find((o) => o.id === orderId)
      if (!order) {
        return NextResponse.json({ message: "Order not found" }, { status: 404 })
      }
      return NextResponse.json(order)
    }

    // Return all orders for the store
    return NextResponse.json({
      orders: storeOrders,
      total: storeOrders.length,
    })
  } catch (error: any) {
    console.error(`API: Error fetching orders for store ${storeId}:`, error)
    return NextResponse.json({ message: "Failed to fetch orders" }, { status: 500 })
  }
}
