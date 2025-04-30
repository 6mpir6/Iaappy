import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavigationUpdate } from "@/components/navigation-update"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Build",
  description: "Generate websites using AI",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="w-full p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-black dark:text-white">
            <div className="flex items-center gap-2">
              {/* Use different logos based on theme */}
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/intelartsblack-IYOBEHZNHT6b6wXJn3mSto15UxlqcT.png"
                alt="Intel-Arts Logo"
                className="h-8 w-auto block dark:hidden"
              />
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/intelarts1-N8DaKHjQ7FZovjhNp0H7G6ppqHYTwZ.png"
                alt="Intel-Arts Logo"
                className="h-8 w-auto hidden dark:block"
              />
              <h1 className="text-2xl font-bold hidden sm:block">Intel-Arts</h1>
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex gap-4">
                <a
                  href="/"
                  className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
                >
                  Build
                </a>
                <a
                  href="/image-generator"
                  className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
                >
                  Generate
                </a>
                <a
                  href="/store"
                  className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
                >
                  Visualize
                </a>
              </nav>

              {/* Connect Store Button removed */}

              <ThemeToggle />
            </div>
          </header>
          <NavigationUpdate />
          <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black text-gray-900 dark:text-white">
            {children}
          </div>
          <footer className="w-full p-4 text-center text-gray-600 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p>© 2025 Intel-Arts</p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
