import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { consentIsCurrent } from '../offline/consent-storage';
import { ConsentScreen } from '../screens/ConsentScreen';
import { TabNavigator } from './TabNavigator';

export function RootNavigator() {
  const [checking, setChecking] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    consentIsCurrent().then((current) => {
      setConsentGiven(current);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0D1B2A" />
      </View>
    );
  }

  if (!consentGiven) {
    return <ConsentScreen onConsent={() => setConsentGiven(true)} />;
  }

  return <TabNavigator />;
}
