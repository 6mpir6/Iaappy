export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Product Image Skeleton */}
        <div className="space-y-4">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-square animate-pulse"></div>
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-24 animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-1/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-2/3 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3 animate-pulse"></div>
          <div className="flex gap-3">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2 animate-pulse"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
