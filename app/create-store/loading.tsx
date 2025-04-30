import { Loader2 } from "lucide-react"

export default function CreateStoreLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Loading Store Creator</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Please wait while we prepare your store creation tools...
        </p>
      </div>
    </div>
  )
}
