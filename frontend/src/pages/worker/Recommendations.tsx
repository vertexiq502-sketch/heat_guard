import { useWorkerData } from '../../hooks/useDashboardData';
import { RecommendationCard } from '../../components/worker/RecommendationCard';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';

export const Recommendations = () => {
  const { data, isLoading, isError, refetch } = useWorkerData();

  if (isLoading) return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <LoadingSkeleton lines={4} />
    </div>
  );

  if (isError) return (
    <div className="p-4 max-w-md mx-auto h-[60vh] flex items-center">
      <ErrorState message="Could not load recommendations." onRetry={() => refetch()} />
    </div>
  );

  const risk = data?.risk;

  if (!risk) return (
    <div className="p-4 max-w-md mx-auto h-[60vh] flex items-center">
      <EmptyState message="No risk assessment available yet." icon="📋" />
    </div>
  );

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
      <p className="text-sm text-gray-600">Based on your current risk level and work conditions.</p>
      <RecommendationCard recommendation={risk.recommendation} riskLevel={risk.risk_level} />
      {risk.explanation && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
          <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-2">Why this risk level?</h3>
          <p className="text-sm text-blue-800 leading-relaxed">{risk.explanation}</p>
        </div>
      )}
    </div>
  );
};
