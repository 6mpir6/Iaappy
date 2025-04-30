import { WebsiteBuilder } from "@/components/website-builder"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black text-gray-900 dark:text-white">
      <div className="flex-1 w-full max-w-7xl p-4">
        <WebsiteBuilder />
      </div>

      <footer className="w-full p-4 text-center text-gray-600 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-800">
        <p>Built with Multi-Agent System</p>
      </footer>
    </main>
  )
}
