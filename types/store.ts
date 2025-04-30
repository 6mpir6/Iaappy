export interface ProductRow {
  id: string
  title: string
  imageUrl: string
  imageUrls: string[] // Add this new field for multiple images
  description: string
  price: string
}

export interface StoreFormData {
  storeName: string
  storeDescription: string
  logoUrl: string
  theme: string
  products: ProductRow[]
}

export const availableThemes = [
  {
    name: "modern",
    label: "Modern",
    styles: {
      primaryColor: "#3498db",
      secondaryColor: "#e74c3c",
      borderRadius: "0.5rem",
      textGlow: false,
    },
  },
  {
    name: "classic",
    label: "Classic",
    styles: {
      primaryColor: "#2c3e50",
      secondaryColor: "#d35400",
      borderRadius: "0",
      textGlow: false,
    },
  },
  {
    name: "elegant",
    label: "Elegant",
    styles: {
      primaryColor: "#8e44ad",
      secondaryColor: "#f39c12",
      borderRadius: "1rem",
      textGlow: true,
    },
  },
]
