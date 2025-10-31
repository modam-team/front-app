import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function StreakBanner({ days = 4 }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{days}일 연속으로 읽었어요!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.muted, padding: 12, marginHorizontal: 16, borderRadius: 8 },
  text: { fontWeight: '600', color: colors.text },
});
