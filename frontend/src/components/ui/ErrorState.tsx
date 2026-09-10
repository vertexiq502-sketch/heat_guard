export const ErrorState = ({ message, onRetry }: { message: string, onRetry?: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-xl border border-red-100 text-center">
    <div className="text-3xl mb-3 text-red-400">⚠️</div>
    <p className="text-red-700 font-medium mb-4">{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow-sm text-sm font-semibold transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);
