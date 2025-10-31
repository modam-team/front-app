// src/screens/HomeScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import ChallengeCard from '../components/ChallengeCard';
import MonthView from '../components/MonthView';

export default function HomeScreen() {
  const [month, setMonth] = useState(10);
  const [year, setYear] = useState(2025);

  const prev = () =>
    setMonth(m => (m === 1 ? (setYear(y => y - 1), 12) : m - 1));
  const next = () =>
    setMonth(m => (m === 12 ? (setYear(y => y + 1), 1) : m + 1));

  return (
    <View style={styles.container}>
      <View style={styles.grayBar}>
        <Text style={styles.grayBarText}>“ 힘이 나는 한마디 ”</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>4일 연속으로 읽었어요!</Text>
        <ChallengeCard />
      </View>

      <View style={styles.section}>
        <Text style={styles.h2}>2025년 10월</Text>
        <MonthView year={year} month={month} onPrev={prev} onNext={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  grayBar: { backgroundColor: colors.shade, paddingVertical: 10, alignItems: 'center' },
  grayBarText: { color: colors.text, fontWeight: '700' },
  section: { paddingTop: 12 },
  h2: { fontSize: 18, fontWeight: '800', color: colors.text, paddingHorizontal: 16, marginBottom: 6 },
});
