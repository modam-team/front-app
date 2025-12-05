import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function TabSegment({ tabs, value, onChange }) {
  return (
    <View style={styles.row}>
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <Pressable
            key={t.value}
            onPress={() => onChange(t.value)}
            style={({ pressed }) => [
              styles.tab,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.label, active && styles.active]}>{t.label}</Text>
            {active && <View style={styles.underline} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 0,
    paddingTop: 10,
    paddingBottom: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  label: { color: colors.tabLabel, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  active: { color: colors.accent },
  underline: {
    height: 2,
    backgroundColor: colors.accent,
    marginTop: 8,
    width: '80%',
    borderRadius: 999,
  },
});
