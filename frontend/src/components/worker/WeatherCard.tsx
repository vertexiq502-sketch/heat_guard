import { useLocalization } from '../../hooks/useLocalization';

function formatRelativeTime(isoTimestamp: string | undefined): string {
  if (!isoTimestamp) return '';
  const diff = Date.now() - new Date(isoTimestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
}

export const WeatherCard = ({ weather }: { weather: any }) => {
  const { t } = useLocalization();
  const isStale = weather.confidence === 'low';
  const relativeTime = formatRelativeTime(weather.timestamp);

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{t('weather_conditions')}</h3>
        {relativeTime && (
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${isStale ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
            {isStale ? '⚠️ ' : '🟢 '}{relativeTime}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">{t('temperature')}</p>
          <p className="text-xl font-bold text-gray-900">{weather.temperature?.toFixed(1)}°C</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">{t('humidity')}</p>
          <p className="text-xl font-bold text-gray-900">{weather.humidity}%</p>
        </div>
        {weather.wind_speed != null && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Wind Speed</p>
            <p className="text-xl font-bold text-gray-900">{weather.wind_speed?.toFixed(1)} km/h</p>
          </div>
        )}
        {weather.uv_index != null && (
          <div>
            <p className="text-xs text-gray-500 mb-1">UV Index</p>
            <p className="text-xl font-bold text-gray-900">{weather.uv_index?.toFixed(1)}</p>
          </div>
        )}
      </div>

      {isStale && (
        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm flex items-start gap-3 border border-yellow-200 mt-2">
          <span className="text-lg leading-none mt-0.5">⚠️</span>
          <p>{t('weather_delayed_warning')}</p>
        </div>
      )}
    </div>
  );
};
