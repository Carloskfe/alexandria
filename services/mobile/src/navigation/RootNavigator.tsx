import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { consentIsCurrent } from '../offline/consent-storage';
import { ConsentScreen } from '../screens/ConsentScreen';
import { PaywallScreen, useSubscriptionStatus, requiresPaywall } from '../screens/PaywallScreen';
import { TabNavigator } from './TabNavigator';

export function RootNavigator() {
  const [checking, setChecking] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  const { status, isLoading: subLoading } = useSubscriptionStatus();

  useEffect(() => {
    consentIsCurrent().then((current) => {
      setConsentGiven(current);
      setChecking(false);
    });
  }, []);

  if (checking || subLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0D1B2A" />
      </View>
    );
  }

  if (!consentGiven) {
    return <ConsentScreen onConsent={() => setConsentGiven(true)} />;
  }

  if (status !== null && requiresPaywall(status)) {
    return <PaywallScreen />;
  }

  return <TabNavigator />;
}
