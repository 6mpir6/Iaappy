"use client"

import { useState } from "react"
import ConnectShopifyButton from "@/components/ConnectShopifyButton"

export default function ConnectStorePage() {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center">Connect Your Store</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-3">Enter your Shopify store domain</label>
            <ConnectShopifyButton />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              We'll securely connect to your Shopify store to import your products.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have a store yet?{" "}
            <a href="/create-store" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Create one
            </a>
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium mb-4">Why Connect Your Shopify Store?</h2>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start">
            <svg
              className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Automatically import all your products and collections</span>
          </li>
          <li className="flex items-start">
            <svg
              className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Create AI-powered product descriptions and images</span>
          </li>
          <li className="flex items-start">
            <svg
              className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Visualize your products in different settings</span>
          </li>
          <li className="flex items-start">
            <svg
              className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Keep your inventory in sync automatically</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
