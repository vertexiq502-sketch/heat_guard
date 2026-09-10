import { useLocalization } from '../../hooks/useLocalization';

export const RecommendationCard = ({ recommendation, riskLevel }: { recommendation: any, riskLevel: string }) => {
  const { t } = useLocalization();

  // If green/safe, we might not show an intense recommendation
  if (!recommendation) return null;

  const isHighRisk = riskLevel === 'orange' || riskLevel === 'red';

  return (
    <div className={`p-5 rounded-2xl border shadow-sm ${isHighRisk ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
      <h3 className={`text-sm font-bold uppercase tracking-wider mb-3 ${isHighRisk ? 'text-red-800' : 'text-blue-900'}`}>
        {t('recommendations_title')}
      </h3>
      
      <div className="space-y-3">
        {recommendation.workStatus && (
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">👷</span>
            <p className={`font-medium ${isHighRisk ? 'text-red-900' : 'text-blue-900'}`}>{recommendation.workStatus}</p>
          </div>
        )}
        
        {recommendation.restInstruction && (
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">⏱️</span>
            <p className={`font-medium ${isHighRisk ? 'text-red-900' : 'text-blue-900'}`}>{recommendation.restInstruction}</p>
          </div>
        )}
      </div>
    </div>
  );
};
