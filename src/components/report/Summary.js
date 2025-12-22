import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { shadow } from "@theme/shadow";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import { splitToLines } from "@utils/textSplit";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Summary({ summary }) {
  // userName은 나중에 실제 유저 이름으로 교체 예정 !
  const {
    year,
    month,
    title,
    description,
    percent,
    userName = "모담",
  } = summary;

  const lines = splitToLines(description, 20);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.headerLine1}>
          {userName} 님의 <Text style={styles.headerMonth}>{month}월</Text>
        </Text>
        <Text style={styles.headerLine2}>
          <Text style={styles.sectionTitle}>독서 기록</Text> 결과예요
        </Text>
      </View>

      {/* 카드 */}
      <View style={styles.card}>
        <Text style={styles.personaTitle}>{title}</Text>
        <Text style={styles.personaSub}>
          모담 회원 중 {percent}% 유형이에요
        </Text>

        {/* 캐릭터 이미지 자리 (지금은 placeholder 박스) */}
        <View style={styles.characterBox}>
          <Text style={styles.characterLabel}>캐릭터</Text>
        </View>

        <Text style={styles.personaDesc}>
          {lines.map((line, i) => (
            <Text key={i}>
              {line}
              {i !== lines.length - 1 && "\n"}
            </Text>
          ))}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 전체 섹션 래퍼
  wrap: {
    marginBottom: spacing.sectionGap,
  },

  // 각 섹션의 타이틀은 bold로 설정 (ex. 독서 기록, 독서 통계, 취향 분석 요 부분)
  sectionTitle: {
    fontWeight: "700",
  },

  // 헤더 영역
  header: {
    marginBottom: spacing.m,
  },
  headerLine1: {
    ...typography["heading-1-medium"],
    color: colors.mono[950],
    marginBottom: 2,
  },
  headerMonth: {
    fontWeight: "700",
    color: colors.primary[500],
  },
  headerLine2: {
    ...typography["heading-1-medium"],
    color: colors.mono[950],
  },

  // 카드
  card: {
    paddingHorizontal: spacing.l,
    paddingVertical: 20,
    borderRadius: radius[500],
    ...shadow[0],
    backgroundColor: "white",
  },
  personaTitle: {
    fontSize: 36,
    fontWeight: "600",
    color: colors.mono[950],
  },
  personaSub: {
    ...typography["body-1-regular"],
    color: colors.mono[950],
    marginBottom: 12,
  },

  // 임시 캐릭터 이미지 부분
  characterBox: {
    height: 250,
    borderRadius: radius[400],
    backgroundColor: colors.mono[0],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  characterLabel: {
    ...typography["body-1-bold"],
    color: colors.mono[950],
  },

  personaDesc: {
    ...typography["heading-4-medium"],
    color: colors.mono[950],
  },
});
