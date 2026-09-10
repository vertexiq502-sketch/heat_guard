import { useLocalization } from '../../hooks/useLocalization';

function formatRelativeTime(isoTimestamp: string | undefined): string {
  if (!isoTimestamp) return '';
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hr ago';
  return `${hours} hrs ago`;
}

export const RiskCard = ({ risk }: { risk: any }) => {
  const { t } = useLocalization();

  let bgClass = 'bg-gray-50 border-gray-200';
  let textClass = 'text-gray-800';
  let icon = '⚪';

  if (risk.risk_level === 'green') {
    bgClass = 'bg-green-50 border-green-200';
    textClass = 'text-green-800';
    icon = '🟢';
  } else if (risk.risk_level === 'yellow') {
    bgClass = 'bg-yellow-50 border-yellow-200';
    textClass = 'text-yellow-800';
    icon = '🟡';
  } else if (risk.risk_level === 'orange') {
    bgClass = 'bg-orange-50 border-orange-200';
    textClass = 'text-orange-800';
    icon = '🟠';
  } else if (risk.risk_level === 'red') {
    bgClass = 'bg-red-50 border-red-200';
    textClass = 'text-red-800';
    icon = '🔴';
  }

  const updatedAt = formatRelativeTime(risk.timestamp);

  return (
    <div className={`p-5 rounded-2xl border shadow-sm ${bgClass}`}>
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{t('current_risk')}</h2>
        <div className="flex items-center gap-2">
          {updatedAt && (
            <span className="text-xs text-gray-400">{updatedAt}</span>
          )}
          <div className="flex items-center gap-1 text-xs font-medium bg-white/60 px-2 py-1 rounded">
            {t('confidence')}
            <span className={risk.confidence === 'high' ? 'text-green-700' : 'text-yellow-700'}>
              {risk.confidence === 'high' ? t('confidence_high') : t('confidence_low')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-4xl">{icon}</span>
        <div>
          <p className={`text-3xl font-bold uppercase ${textClass}`}>{t(risk.risk_level) || risk.risk_level}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-black/5 flex justify-between items-center text-sm">
        <span className="text-gray-600">{t('effective_temp')}:</span>
        <span className={`font-bold ${textClass} text-base`}>{risk.effective_temp?.toFixed(1)}°C</span>
      </div>

      {risk.explanation && (
        <p className="mt-3 text-xs text-gray-500 leading-relaxed">{risk.explanation}</p>
      )}
    </div>
  );
};
