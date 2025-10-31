// src/screens/AddEntryScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function AddEntryScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>오늘의 독서 기록 추가</Text>
      <Text style={styles.sub}>여기에 텍스트/책 선택/시간 입력 UI를 붙일 예정</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sub: { marginTop: 8, color: '#6b7280' },
});
