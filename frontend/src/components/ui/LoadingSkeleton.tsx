export const LoadingSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="animate-pulse space-y-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-3 bg-gray-200 rounded w-full"></div>
    ))}
  </div>
);
