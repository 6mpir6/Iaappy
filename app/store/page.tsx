"use client"

import { ProductGrid } from "@/components/product-grid"
import { CategoryNav } from "@/components/category-nav"
import { FeaturedProducts } from "@/components/featured-products"
import { SearchBar } from "@/components/search-bar"
import { VisualizerPlugin } from "@/components/visualizer-plugin"
import { Button } from "@/components/ui/button"
import RealtimeChat from "@/components/realtime-chat"

export default function StorePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header - update for dark mode */}
      <header className="bg-gray-900/80 dark:bg-black/80 text-white sticky top-0 z-50 shadow-md backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-white dark:text-white">Product Visualizer</h1>
              <div className="flex md:hidden">
                <button aria-label="Menu" className="text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            <SearchBar />

            <div className="hidden md:flex items-center space-x-6">
              <a href="#" className="hover:text-emerald-400 transition text-white dark:text-white">
                Home
              </a>
              <a href="#" className="hover:text-emerald-400 transition text-white dark:text-white">
                Shop
              </a>
              <a href="#" className="hover:text-emerald-400 transition text-white dark:text-white">
                About
              </a>
              <a href="#" className="hover:text-emerald-400 transition text-white dark:text-white">
                Contact
              </a>
            </div>

            <div className="flex items-center space-x-4 md:space-x-6">
              <button aria-label="Search" className="md:hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white dark:text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              <a href="/store/cart" className="relative group">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 group-hover:text-emerald-400 transition-colors text-white dark:text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </a>
              <button aria-label="Account" className="group">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 group-hover:text-emerald-400 transition-colors text-white dark:text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm hidden md:inline-flex">
                <a href="https://buy.stripe.com/28oaHP274fcggh25kw" target="_blank" rel="noopener noreferrer">
                  Buy Plug-In
                </a>
              </Button>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm md:hidden">
              <a href="https://buy.stripe.com/28oaHP274fcggh25kw" target="_blank" rel="noopener noreferrer">
                Buy Plug-In
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Purchase Visualizer Plugin */}
      <VisualizerPlugin />

      {/* Hero Banner - update for dark mode */}
      <section className="relative bg-gray-900 dark:bg-black text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-80">
          <img src="/summer-fashion-banner.jpg" alt="Summer Collection" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent z-5"></div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-lg">
            <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full mb-4">
              New Collection
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Summer Styles Have Arrived</h2>
            <p className="text-gray-200 mb-8 text-lg">
              Discover our latest collection of apparel, accessories, and home goods designed for the season.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#featured"
                className="bg-emerald-600 text-white px-6 py-3 rounded-md hover:bg-emerald-700 transition inline-block"
              >
                Shop Now
              </a>
              <a
                href="#categories"
                className="bg-transparent border border-white text-white px-6 py-3 rounded-md hover:bg-white/10 transition inline-block"
              >
                Explore Categories
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation - update for dark mode */}
      <section id="categories" className="py-12 bg-white dark:bg-gray-900">
        <CategoryNav />
      </section>

      {/* Featured Products - update for dark mode */}
      <section id="featured" className="py-16 bg-gray-50 dark:bg-gray-800">
        <FeaturedProducts />
      </section>

      {/* Main Product Grid - update for dark mode */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">All Products</h2>
          <ProductGrid />
        </div>
      </section>

      {/* Newsletter - keep emerald background for both themes */}
      <section className="py-16 bg-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Join Our Newsletter</h2>
            <p className="mb-8">Stay updated with our latest products, trends, and exclusive offers.</p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="px-4 py-3 rounded-md flex-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button className="bg-gray-900 text-white px-6 py-3 rounded-md hover:bg-gray-800 transition">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - already dark, no changes needed */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">StyleHub</h3>
              <p className="text-gray-400">Your one-stop shop for fashion, accessories, and home decor.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Shop</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Apparel
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Footwear
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Accessories
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Home
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Customer Service</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Shipping
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition">
                    Returns
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Stay Connected</h4>
              <div className="flex space-x-4 mb-4">
                <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-white transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </a>
                <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-white transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0-3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-white transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Add Realtime Chat */}
      <RealtimeChat />
    </main>
  )
}
