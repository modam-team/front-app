import BasicCharacter from "@assets/basic-profile.svg";
import Button from "@components/Button";
import {
  PERSONA_SLUG_MAP,
  PLACE_SLUG_MAP,
  REPORT_CHARACTER_ILLUSTRATION_MAP,
} from "@constants/reportCharacterIllustrations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function GoalResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // 노치 계산 용
  const insets = useSafeAreaInsets();

  // Home에서 navigate로 넘겨준 값들
  const { achieved, summary } = route.params || {};
  const { isEmpty, title, placeKey } = summary || {};

  // 뒤로가기(안드로이드/제스처) 막고 싶으면 옵션으로 처리
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      gestureEnabled: false, // iOS 스와이프 백 방지
    });
  }, [navigation]);

  const characterPng = useMemo(() => {
    if (!summary || isEmpty) return null;

    const personaKey = title?.trim().split(/\s+/).pop();
    const placeSlug = placeKey ? PLACE_SLUG_MAP[placeKey] : null;
    const personaSlug = personaKey ? PERSONA_SLUG_MAP[personaKey] : null;

    return placeSlug && personaSlug
      ? (REPORT_CHARACTER_ILLUSTRATION_MAP?.[placeSlug]?.[personaSlug] ?? null)
      : null;
  }, [summary, isEmpty, title, placeKey]);

  // 월 키 계산 함수
  const getMonthKey = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  };

  const getPrevMonthKey = (date = new Date()) => {
    const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    return getMonthKey(d);
  };

  return (
    <View style={styles.wrap}>
      {/* 상단 로고 */}
      <View style={[styles.logoArea, { top: insets.top + 12 }]}>
        <Text style={styles.logo}>modam</Text>
      </View>

      <View style={styles.card}>
        {/* 캐릭터 */}
        <View style={styles.characterBox}>
          {characterPng ? (
            <Image
              source={characterPng}
              style={styles.characterImage}
              resizeMode="contain"
            />
          ) : (
            <BasicCharacter
              width="100%"
              height="100%"
            />
          )}
        </View>

        <View style={styles.textArea}>
          <Text style={styles.title}>
            {achieved ? "미션 완료" : "미션 실패"}
          </Text>
          <Text style={styles.subtitle}>
            {achieved
              ? "목표 권수를 달성했어요!"
              : "목표 권수를 달성하지 못했어요.."}
          </Text>
        </View>

        <View style={styles.descriptionArea}>
          <Text style={styles.description}>
            {achieved
              ? "다음 달도 즐겁게 독서해 볼까요?"
              : "다음 달은 더 즐겁게 독서해요!"}
          </Text>
        </View>

        {/* 여기서 새 목표 설정 화면 / 홈으로 강제 이동 */}
        <Button
          label="홈에서 새 목표 설정하기"
          variant="primary"
          tone="fill"
          size="large"
          fullWidth
          onPress={async () => {
            const now = new Date();
            const thisMonthKey = getMonthKey(now);
            const prevMonthKey = getPrevMonthKey(now);

            await AsyncStorage.setItem("lastSeenMonthKey", thisMonthKey);
            await AsyncStorage.setItem(
              "pendingResultForMonthKey",
              prevMonthKey,
            );
            await AsyncStorage.setItem("pendingGoalEdit", "1");

            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "Root",
                  state: {
                    index: 1,
                    routes: [
                      { name: "책장" },
                      { name: "홈", params: { openGoalEditor: true } },
                      { name: "리포트" },
                    ],
                  },
                },
              ],
            });
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 화면 래퍼
  wrap: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  // 로고 영역
  logoArea: {
    position: "absolute",
    paddingHorizontal: 20,
    left: 0, // 얘만 왼쪽 정렬 되게 left 속성 추가 해줌 !
  },

  // 로고 텍스트
  logo: {
    color: colors.primary[400],
    fontSize: 16,
    fontWeight: "600",
  },

  // 메인 콘텐츠 영역
  card: {
    width: "100%",
    alignItems: "center",
  },

  // 캐릭터가 띄워질 원
  characterBox: {
    width: 184,
    height: 178,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 45,
  },

  // 캐릭터 이미지 스타일
  characterImage: { width: "100%", height: "100%" },

  // 캡션을 제외한 텍스트들 전체 영역
  textArea: { marginBottom: 27 },

  // 미션 실패 or 성공 텍스트
  title: {
    ...typography["heading-2-medium"],
    color: colors.mono[950],
    textAlign: "center",
  },

  // 격려 문구 텍스트
  subtitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.mono[950],
  },

  descriptionArea: { marginBottom: 47 },

  // 캡션
  description: {
    ...typography["heading-4-medium"],
    color: colors.mono[700],
  },
});
