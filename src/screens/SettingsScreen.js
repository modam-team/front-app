// src/screens/SettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function SettingsScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>설정</Text>
      <Text style={styles.sub}>알림, 백업, 테마 등</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  sub: { marginTop: 8, color: '#6b7280' },
});
