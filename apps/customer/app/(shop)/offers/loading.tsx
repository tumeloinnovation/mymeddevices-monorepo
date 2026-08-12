export default function OffersLoading() {
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Hero section skeleton */}
        <div className="mb-8">
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        </div>

        {/* Category filter skeleton */}
        <div className="flex gap-3 mb-6 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Offers grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-full max-w-[280px] space-y-3">
              <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
