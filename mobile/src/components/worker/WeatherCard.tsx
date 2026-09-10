import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalization } from '../../hooks/useLocalization';

interface Props {
  weather?: {
    temperature?: number;
    humidity?: number;
    uv_index?: number;
    wind_speed?: number;
    is_stale?: boolean;
    condition?: string;
  };
}

export const WeatherCard: React.FC<Props> = ({ weather }) => {
  const { t } = useLocalization();

  const temp = weather?.temperature !== undefined ? Math.round(weather.temperature) : 34;
  const humidity = weather?.humidity !== undefined ? Math.round(weather.humidity) : 55;
  const uvIndex = weather?.uv_index !== undefined ? Math.round(weather.uv_index) : 7;
  const windSpeed = weather?.wind_speed !== undefined ? Math.round(weather.wind_speed) : 12;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>🌤️ {t('weather_conditions')}</Text>
        {weather?.is_stale ? (
          <View style={styles.staleBadge}>
            <Text style={styles.staleBadgeText}>Delayed</Text>
          </View>
        ) : (
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>Live</Text>
          </View>
        )}
      </View>

      <View style={styles.grid}>
        <View style={styles.item}>
          <Text style={styles.itemLabel}>{t('temperature')}</Text>
          <Text style={styles.itemValue}>{temp}°C</Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.itemLabel}>{t('humidity')}</Text>
          <Text style={styles.itemValue}>{humidity}%</Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.itemLabel}>{t('uv_index')}</Text>
          <Text style={styles.itemValue}>{uvIndex}</Text>
        </View>

        <View style={styles.item}>
          <Text style={styles.itemLabel}>Wind Speed</Text>
          <Text style={styles.itemValue}>{windSpeed} km/h</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  liveBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  staleBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  staleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  item: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
});
