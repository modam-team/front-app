import { fetchUserProfile, updateThemeColor } from "@apis/userApi";
import ActionBottomSheet from "@components/ActionBottomSheet";
import AppHeader from "@components/common/AppHeader";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * 테마로 선택 가능한 색상 목록
 * - key: 내부 식별자 (서버 / 전역 상태용)
 * - label: 사용자에게 보여줄 이름
 * - dot: 화면에 표시할 색상 값
 */
const THEME_OPTIONS = [
  { key: "green", label: "그린", dot: colors.primary[400] },
  { key: "pink", label: "핑크", dot: "#E75A80" },
  { key: "yellow", label: "옐로우", dot: "#FFC209" },
];

export default function ThemeScreen({ navigation }) {
  // 바텀 시트 노출 여부
  const [sheetVisible, setSheetVisible] = useState(false);

  const [themeColor, setThemeColor] = useState(null);

  // 중복 클릭 방지
  const [saving, setSaving] = useState(false);

  // 현재 선택된 테마 객체
  const current = useMemo(
    () =>
      THEME_OPTIONS.find(
        (t) => t.dot.toLowerCase() === (themeColor ?? "").toLowerCase(),
      ) ?? THEME_OPTIONS[0],
    [themeColor],
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const profile = await fetchUserProfile();
        if (!mounted) return;

        // 서버 값이 없을 때를 대비해 fallback
        setThemeColor(profile?.themeColor ?? THEME_OPTIONS[0].dot);
      } catch (e) {
        // 실패하면 기본값
        setThemeColor(THEME_OPTIONS[0].dot);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // 바텀 시트 열기 및 닫기
  const openSheet = () => setSheetVisible(true);
  const closeSheet = () => setSheetVisible(false);

  const handleSelectTheme = async (opt) => {
    if (saving) return;

    const nextColor = opt.dot;
    const prevColor = themeColor;

    // ui 먼저 반영하기 (낙관적 업데이트)
    setThemeColor(nextColor);
    setSheetVisible(false);

    // 실제 서버 patch
    try {
      setSaving(true);
      await updateThemeColor(nextColor);
    } catch (e) {
      // 실패 했으니까 ui 롤백해줬음
      setThemeColor(prevColor);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* 상단 헤더 */}
      <AppHeader
        title="테마"
        showBack
        onPressBack={() => navigation.goBack()}
      />

      {/* 메인 콘텐츠 영역 */}
      <View style={styles.body}>
        {/* 색상 선택 row */}
        <Pressable
          onPress={openSheet}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        >
          {/* 왼쪽 라벨 */}
          <Text style={styles.rowLeft}>색상</Text>

          {/* 오른쪽 현재 선택된 색상 + 드롭다운 아이콘 */}
          <View style={styles.rowRight}>
            <View style={[styles.dot, { backgroundColor: current.dot }]} />
            <MaterialIcons
              name="keyboard-arrow-down"
              size={20}
              color={colors.mono[500]}
            />
          </View>
        </Pressable>
      </View>

      {/* 바텀시트 */}
      <ActionBottomSheet
        visible={sheetVisible}
        onClose={closeSheet}
        height={200}
        title="색상"
      >
        {/* 실제 색상 선택 버튼들 */}
        <View style={styles.paletteRow}>
          {THEME_OPTIONS.map((opt) => {
            const selected =
              themeColor && themeColor.toLowerCase() === opt.dot.toLowerCase();

            return (
              <Pressable
                key={opt.key}
                onPress={() => handleSelectTheme(opt)}
                disabled={saving} // 저장 중엔 클릭 막아두기
                style={({ pressed }) => [
                  styles.colorBtn,
                  pressed && { opacity: 0.6 },
                  selected && styles.colorBtnSelected,
                ]}
              >
                {/* 색상 원 */}
                <View
                  style={[styles.paletteDot, { backgroundColor: opt.dot }]}
                />
              </Pressable>
            );
          })}
        </View>
      </ActionBottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 화면 전체 래퍼
  safe: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },

  // 본문 영역
  body: {
    paddingTop: 37,
    paddingHorizontal: 17,
  },

  // 색상 선택 row
  row: {
    height: 37,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: colors.mono[150],
    borderBottomWidth: 0.5,
    borderBottomColor: colors.mono[150],
  },

  // row 눌렸을 때 피드백
  rowPressed: {
    opacity: 0.6,
  },

  // row 왼쪽 텍스트
  rowLeft: {
    ...typography["body-2-regular"],
    color: colors.mono[950],
  },

  // row 오른쪽 영역
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  // 현재 선택된 색상 미리보기
  dot: {
    width: 21,
    height: 21,
    borderRadius: 999,
  },

  // 바텀시트 내부 색상 버튼 컨테이너
  paletteRow: {
    flexDirection: "row",
    gap: 16,
  },

  // 개별 색상 버튼 컨테이너
  colorBtn: {
    width: 35,
    height: 35,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  // 선택된 색상 버튼 스타일
  colorBtnSelected: {
    borderColor: colors.mono[400],
    borderWidth: 1,
  },

  // 색상 원
  paletteDot: {
    width: 31,
    height: 31,
    borderRadius: 999,
  },
});
