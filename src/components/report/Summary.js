import BasicCharacter from "@assets/basic-profile.svg";
import Button from "@components/Button";
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
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

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
  const CombinedSvg = isEmpty
    ? BasicCharacter
    : placeSlug && personaSlug
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
            <View style={styles.basicAvatar}>
              <BasicCharacter
                width={49}
                height={49}
              />
            </View>
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
          <CombinedSvg
            width="100%"
            height="100%"
          />
        </View>

        <Text style={[styles.personaDesc, isEmpty && styles.personaEmptyDesc]}>
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

  /* ================================== */

  // 프사랑 프로필 편집 버튼
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },

  // 프사 동그라미
  profileCircle: {
    width: 49,
    height: 49,
    borderRadius: 999,
    overflow: "hidden",
  },

  // 프사 이미지
  profileImage: {
    width: "100%",
    height: "100%",
  },

  // 기본 프사 캐릭터
  basicAvatar: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ================================== */

  // 헤더 영역
  header: {
    marginBottom: 26,
  },

  // 'ㅇㅇ님의' 텍스트
  headerLine1: {
    fontSize: 28,
    fontWeight: 500,
  },

  // '이번 달 or 지난 달' 텍스트
  headerMonth: {
    fontWeight: "700",
    fontSize: 30,
  },

  // '결과예요' 텍스트
  headerLine2: {
    fontSize: 28,
    fontWeight: 500,
  },

  /* ================================== */

  // 카드
  card: {
    marginHorizontal: 12,
    paddingHorizontal: spacing.l,
    paddingVertical: 20,
    borderRadius: radius[500],
    backgroundColor: colors.mono[0],
  },

  // 어떤 유형인지 텍스트
  personaTitle: {
    fontSize: 36,
    fontWeight: "600",
    color: colors.mono[950],
  },

  // '아직 측정되지 않았어요' 텍스트
  personaTitleEmpty: {
    fontSize: 28,
    fontWeight: "500",
    color: colors.mono[950],
  },

  // 유형 아래의 캡션 텍스트
  personaSub: {
    ...typography["body-1-regular"],
    color: colors.mono[950],
    marginBottom: 12,
  },

  // 캐릭터 이미지 부분
  characterBox: {
    height: 248,
    borderRadius: radius[400],
    backgroundColor: colors.mono[0],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
    position: "relative",
  },

  // 캐릭터 하단 문구
  personaDesc: {
    ...typography["heading-4-medium"],
    color: colors.mono[950],
  },

  // 유형이 측정되지 않았을 때의 캐릭터 하단 문구
  personaEmptyDesc: {
    ...typography["heading-3-medium"],
    color: colors.mono[950],
  },
});
