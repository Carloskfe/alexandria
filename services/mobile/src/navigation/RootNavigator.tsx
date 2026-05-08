import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { consentIsCurrent } from '../offline/consent-storage';
import { isLoggedIn } from '../auth/token-storage';
import { AuthProvider } from '../auth/AuthContext';
import { ConsentScreen } from '../screens/ConsentScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { MainNavigator } from './MainNavigator';

type AppState = 'loading' | 'consent' | 'login' | 'app';

export function RootNavigator() {
  const [state, setState] = useState<AppState>('loading');

  useEffect(() => {
    Promise.all([consentIsCurrent(), isLoggedIn()]).then(([consent, authed]) => {
      if (!consent) { setState('consent'); return; }
      if (!authed)  { setState('login');   return; }
      setState('app');
    });
  }, []);

  if (state === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (state === 'consent') {
    return (
      <ConsentScreen
        onConsent={() => setState('login')}
      />
    );
  }

  if (state === 'login') {
    return <LoginScreen onLogin={() => setState('app')} />;
  }

  return (
    <AuthProvider onLogout={() => setState('login')}>
      <MainNavigator />
    </AuthProvider>
  );
}
