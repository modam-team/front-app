import Button from "@components/Button";
import ProfilePlaceholder from "@components/ProfilePlaceholder";
import {
  PERSONA_SLUG_MAP,
  PLACE_SLUG_MAP,
  REPORT_CHARACTER_ILLUSTRATION_MAP,
} from "@constants/reportCharacterIllustrations";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { shadow } from "@theme/shadow";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import { splitToLines } from "@utils/textSplit";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Summary({
  summary,
  userName,
  isCurrentMonth,
  onPressEditProfile,
  onPressProfile,
  profileImageUrl,
}) {
  const { title, description, percent, isEmpty, characterKey, placeKey } =
    summary;

  const personaKey = title?.trim().split(/\s+/).pop();

  // slug 변환
  const placeSlug = placeKey ? PLACE_SLUG_MAP[placeKey] : null;
  const personaSlug = personaKey ? PERSONA_SLUG_MAP[personaKey] : null;

  // 합쳐진 SVG 선택
  const CombinedSvg =
    !isEmpty && placeSlug && personaSlug
      ? (REPORT_CHARACTER_ILLUSTRATION_MAP?.[placeSlug]?.[personaSlug] ?? null)
      : null;

  const lines = splitToLines(description, 20);

  const currentMonthStyle = {
    headerText: colors.mono[0],
    monthText: colors.mono[0],
  };

  const pastMonthStyle = {
    headerText: colors.mono[950],
    monthText: colors.primary[500],
  };

  const styleSet = isEmpty
    ? pastMonthStyle
    : isCurrentMonth
      ? currentMonthStyle
      : pastMonthStyle;

  return (
    <View style={styles.wrap}>
      {/* 상단 프로필 / 편집 */}
      <View style={styles.headerTop}>
        <Pressable
          onPress={onPressProfile}
          disabled={!onPressProfile}
          style={styles.profileCircle}
          hitSlop={8}
        >
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
              style={styles.profileImage}
            />
          ) : (
            <ProfilePlaceholder size={49} />
          )}
        </Pressable>

        <Button
          label="프로필 편집"
          onPress={onPressEditProfile}
          variant="primary"
          tone="outline"
          size="small"
          style={styles.editBtn}
          textStyle={styles.editBtnText}
        />
      </View>
      <View style={styles.header}>
        <Text style={[styles.headerLine1, { color: styleSet.headerText }]}>
          {userName} 님의{" "}
          <Text style={[styles.headerMonth, { color: styleSet.monthText }]}>
            {isCurrentMonth ? "이번 달" : "지난 달"}
          </Text>
        </Text>
        <Text style={[styles.headerLine2, { color: styleSet.headerText }]}>
          <Text style={[styles.headerMonth, { color: styleSet.headerText }]}>
            독서 기록
          </Text>{" "}
          결과예요
        </Text>
      </View>

      {/* 카드 */}
      <View style={styles.card}>
        <Text
          style={[styles.personaTitle, isEmpty && styles.personaTitleEmpty]}
        >
          {title}
        </Text>
        <Text style={styles.personaSub}>
          {isEmpty
            ? "지난달에 아직 독서를 하지 않았어요"
            : `모담 회원 중 ${percent}% 유형이에요`}
        </Text>

        {/* 캐릭터 이미지 자리 */}
        <View style={styles.characterBox}>
          {CombinedSvg ? (
            <CombinedSvg
              width="100%"
              height="100%"
            />
          ) : (
            <Text style={styles.characterLabel}>캐릭터</Text>
          )}
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
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  profileCircle: {
    width: 49,
    height: 49,
    borderRadius: 999,
    backgroundColor: colors.mono[0],
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profileFallback: {
    flex: 1,
    backgroundColor: colors.mono[200],
  },

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
    marginBottom: 28,
  },
  headerLine1: {
    fontSize: 28,
    fontWeight: 400,
    color: "white",
  },
  headerMonth: {
    fontWeight: "700",
    fontSize: 28,
    color: "white",
  },
  headerLine2: {
    fontSize: 28,
    fontWeight: 400,
    color: "white",
  },

  // 카드
  card: {
    marginHorizontal: 12,
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
  personaTitleEmpty: {
    fontSize: 28,
    fontWeight: "500",
    color: colors.mono[950],
  },
  personaSub: {
    ...typography["body-1-regular"],
    color: colors.mono[950],
    marginBottom: 12,
  },

  // 임시 캐릭터 이미지 부분
  characterBox: {
    height: 248,
    borderRadius: radius[400],
    backgroundColor: colors.mono[0],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
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
