import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/lib/supabase';
import { useAuthStore } from './src/store/authStore';
import { useLocalization } from './src/hooks/useLocalization';
import { Header } from './src/components/common/Header';
import { LoadingSkeleton } from './src/components/common/LoadingSkeleton';

// Screens
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SignUpScreen } from './src/screens/auth/SignUpScreen';
import { WorkerHomeScreen } from './src/screens/worker/WorkerHomeScreen';
import { WorkerAlertsScreen } from './src/screens/worker/WorkerAlertsScreen';
import { WorkerProfileScreen } from './src/screens/worker/WorkerProfileScreen';
import { WorkerRecommendationsScreen } from './src/screens/worker/WorkerRecommendationsScreen';
import { SupervisorDashboardScreen } from './src/screens/supervisor/SupervisorDashboardScreen';
import { AuthorityOverviewScreen } from './src/screens/authority/AuthorityOverviewScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type WorkerTab = 'home' | 'alerts' | 'recommendations' | 'profile';

function MainApp() {
  const { t } = useLocalization();
  const { user, setUser, isLoadingSession, setLoadingSession } = useAuthStore();
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [workerTab, setWorkerTab] = useState<WorkerTab>('home');

  // Check and restore active Supabase session on launch
  useEffect(() => {
    async function restoreSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userData && !error) {
            setUser(userData);
          } else {
            // No profile found, sign out to prevent orphan access
            await supabase.auth.signOut();
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Session restoration failed:', err);
      } finally {
        setLoadingSession(false);
      }
    }

    restoreSession();

    // Listen for auth state changes from Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoadingSession]);

  if (isLoadingSession) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSkeleton message="Starting Suraksha Heat Shield..." />
      </SafeAreaView>
    );
  }

  // If unauthenticated: render Login / SignUp
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <Header />
        {authScreen === 'login' ? (
          <LoginScreen onNavigateToSignUp={() => setAuthScreen('signup')} />
        ) : (
          <SignUpScreen onNavigateToLogin={() => setAuthScreen('login')} />
        )}
      </SafeAreaView>
    );
  }

  // If Supervisor: render Supervisor Dashboard
  if (user.role === 'supervisor') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <Header title="Supervisor Portal" subtitle="Suraksha Fleet & Site Safety" />
        <SupervisorDashboardScreen />
      </SafeAreaView>
    );
  }

  // If Authority: render Authority Overview
  if (user.role === 'authority') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <Header title="District Authority" subtitle="Heat Action Plan Compliance" />
        <AuthorityOverviewScreen />
      </SafeAreaView>
    );
  }

  // Otherwise: Worker role with 4 bottom tabs
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Header
        title={t('dashboard_title')}
        subtitle={user.name ? `${user.name} • Active Shift` : 'Personalized Heat Risk'}
      />

      <View style={styles.screenContainer}>
        {workerTab === 'home' && (
          <WorkerHomeScreen
            onNavigateToAlerts={() => setWorkerTab('alerts')}
            onNavigateToRecommendations={() => setWorkerTab('recommendations')}
          />
        )}
        {workerTab === 'alerts' && <WorkerAlertsScreen />}
        {workerTab === 'recommendations' && <WorkerRecommendationsScreen />}
        {workerTab === 'profile' && <WorkerProfileScreen />}
      </View>

      {/* Worker Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => setWorkerTab('home')}
          style={[styles.navItem, workerTab === 'home' && styles.activeNavItem]}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, workerTab === 'home' && styles.activeNavLabel]}>
            {t('nav_home')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setWorkerTab('alerts')}
          style={[styles.navItem, workerTab === 'alerts' && styles.activeNavItem]}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>🚨</Text>
          <Text style={[styles.navLabel, workerTab === 'alerts' && styles.activeNavLabel]}>
            {t('nav_alerts')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setWorkerTab('recommendations')}
          style={[styles.navItem, workerTab === 'recommendations' && styles.activeNavItem]}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>📋</Text>
          <Text style={[styles.navLabel, workerTab === 'recommendations' && styles.activeNavLabel]}>
            Safety
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setWorkerTab('profile')}
          style={[styles.navItem, workerTab === 'profile' && styles.activeNavItem]}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={[styles.navLabel, workerTab === 'profile' && styles.activeNavLabel]}>
            {t('nav_profile')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <MainApp />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeNavItem: {
    backgroundColor: '#eff6ff',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  activeNavLabel: {
    color: '#2563eb',
    fontWeight: '700',
  },
});
