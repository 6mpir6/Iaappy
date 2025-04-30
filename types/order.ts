export interface ShippingInfo {
  firstName: string
  lastName: string
  email: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

export interface PaymentInfo {
  cardNumber: string
  cardName: string
  expiryDate: string
  cvv: string
  lastFour: string
  cardType: string
}

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  size?: string
  color?: string
}

export interface Order {
  id: string
  storeId: string
  customerId?: string
  orderNumber: string
  items: OrderItem[]
  shippingInfo: ShippingInfo
  paymentInfo: Partial<PaymentInfo>
  subtotal: number
  shipping: number
  tax: number
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  createdAt: string
  updatedAt: string
}
