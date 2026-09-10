import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalization } from '../../hooks/useLocalization';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  alert: {
    id: string;
    severity?: string;
    alert_type?: string;
    title?: string;
    message?: string;
    title_te?: string;
    message_te?: string;
    title_hi?: string;
    message_hi?: string;
    acknowledged?: boolean;
    acknowledged_at?: string;
    created_at?: string;
  };
  workerLanguage?: string;
  siteName?: string;
}

export const AlertCard: React.FC<Props> = ({ alert, workerLanguage, siteName }) => {
  const { t, language } = useLocalization();
  const queryClient = useQueryClient();
  const [isAcking, setIsAcking] = useState(false);
  const [acked, setAcked] = useState(alert.acknowledged || false);

  const effectiveLang = workerLanguage || language || 'en';

  const title =
    effectiveLang === 'te' && alert.title_te
      ? alert.title_te
      : effectiveLang === 'hi' && alert.title_hi
      ? alert.title_hi
      : alert.title || 'Heat Alert';

  const message =
    effectiveLang === 'te' && alert.message_te
      ? alert.message_te
      : effectiveLang === 'hi' && alert.message_hi
      ? alert.message_hi
      : alert.message || '';

  const isDanger = (alert.severity || '').toLowerCase() === 'red' || (alert.severity || '').toLowerCase() === 'danger';

  const handleAcknowledge = async () => {
    if (acked || isAcking) return;
    setIsAcking(true);
    try {
      await apiClient.post(`/alerts/${alert.id}/acknowledge`);
      setAcked(true);
      queryClient.invalidateQueries({ queryKey: ['workerDashboard'] });
    } catch (err) {
      console.warn('Failed to acknowledge alert:', err);
    } finally {
      setIsAcking(false);
    }
  };

  return (
    <View style={[styles.card, isDanger ? styles.dangerBorder : styles.cautionBorder]}>
      <View style={styles.topRow}>
        <View style={styles.titleArea}>
          <Text style={styles.icon}>{isDanger ? '🚨' : '⚠️'}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={[styles.badge, isDanger ? styles.dangerBadge : styles.cautionBadge]}>
          <Text style={[styles.badgeText, isDanger ? styles.dangerText : styles.cautionText]}>
            {isDanger ? t('danger').toUpperCase() : t('caution').toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.message}>{message}</Text>

      <View style={styles.footer}>
        <Text style={styles.siteInfo}>
          {siteName ? `📍 ${siteName}` : ''}
          {alert.created_at
            ? ` • ${new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : ''}
        </Text>

        {acked ? (
          <View style={styles.ackedBadge}>
            <Text style={styles.ackedText}>✓ {t('acknowledged')}</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleAcknowledge}
            disabled={isAcking}
            style={styles.ackBtn}
            activeOpacity={0.7}
          >
            {isAcking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.ackBtnText}>{t('acknowledge')}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  dangerBorder: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffaf0',
  },
  cautionBorder: {
    borderColor: '#fde047',
    backgroundColor: '#fffff8',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dangerBadge: {
    backgroundColor: '#fee2e2',
  },
  cautionBadge: {
    backgroundColor: '#fef3c7',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  dangerText: {
    color: '#b91c1c',
  },
  cautionText: {
    color: '#b45309',
  },
  message: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  siteInfo: {
    fontSize: 11,
    color: '#64748b',
  },
  ackBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ackBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ackedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  ackedText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
});
