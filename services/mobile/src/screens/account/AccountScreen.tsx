import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { apiClient } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

interface User {
  id: string;
  name: string | null;
  email: string;
  userType: string;
}

const USER_TYPE_LABELS: Record<string, string> = {
  personal: 'Lector personal',
  author: 'Autor',
  editorial: 'Casa editorial',
};

export function AccountScreen() {
  const { logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<User>('/users/me').then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  }, [logout]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>;
  }

  const displayName = user?.name ?? user?.email ?? 'Usuario';
  const initials = displayName.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Mi cuenta</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.name ?? 'Sin nombre'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.userType && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {USER_TYPE_LABELS[user.userType] ?? user.userType}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          accessibilityLabel="Cerrar sesión"
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { fontSize: 28, fontWeight: '800', color: '#0D1B2A', marginBottom: 28 },
  profileCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  profileInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '700', color: '#0D1B2A', marginBottom: 2 },
  email: { fontSize: 14, color: '#6B7280', marginBottom: 6 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#EDE9FE', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 12, color: '#4F46E5', fontWeight: '600' },
  section: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 24 },
  logoutBtn: {
    borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
