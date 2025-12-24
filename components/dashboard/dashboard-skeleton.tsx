export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-3 md:p-6">
      <div className="max-w-[1800px] mx-auto space-y-4 md:space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 md:w-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
            <div className="h-4 w-32 md:w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
          </div>
          <div className="h-10 w-24 md:w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2" />
              <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-2" />
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Large Card */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800/50 rounded-xl p-4 md:p-6 border border-gray-100 dark:border-gray-700">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2" />
                    <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Side Card */}
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 md:p-6 border border-gray-100 dark:border-gray-700">
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-14 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-3" />
              <div className="space-y-2">
                {[1, 2].map((j) => (
                  <div key={j} className="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Loading indicator */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600 dark:text-gray-300">Loading LifeHub...</span>
      </div>
    </div>
  )
}


