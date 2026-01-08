import { changeCategories, fetchUserProfile } from "@apis/userApi";
import AppHeader from "@components/AppHeader";
import Button from "@components/Button";
import Chip from "@components/Chip";
import { GENRES } from "@constants/genres";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PREF_GENRES_KEY = "preferredGenres";

export default function ChangeGenreScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 기존 값
  const [initialCategories, setInitialCategories] = useState([]);

  // 사용자가 고르는 값
  const [categories, setCategories] = useState([]);

  // 처음 로드되는 것 (기존 값 - preferrecCategories에서 가져옴)
  const parsePreferredCategories = (raw) => {
    if (!raw) return [];

    // 배열로 들어오면
    if (Array.isArray(raw)) return raw;

    // 문자열로 들어오면
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) return [];

      // json 배열 문자열이면 파싱
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const arr = JSON.parse(trimmed);
          return Array.isArray(arr) ? arr : [];
        } catch (e) {
          // 실패하면 아래에서 스플릿
        }
      }

      // , 아니면 공백 기반으로 split
      return trimmed
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return [];
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const profile = await fetchUserProfile();

        const preferredArr = parsePreferredCategories(
          profile?.preferredCategories,
        );
        const sliced = preferredArr.slice(0, 3);

        if (!mounted) return;
        setInitialCategories(sliced);
        setCategories(sliced);
      } catch (e) {
        console.error("선호 장르 조회 실패", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const isSelected = (item) => categories.includes(item);

  const toggleCategory = (item) => {
    if (saving) return;

    if (isSelected(item)) {
      setCategories((prev) => prev.filter((c) => c !== item));
    } else {
      setCategories((prev) => {
        if (prev.length >= 3) return prev; // 최대 3개까지만 가능
        return [...prev, item];
      });
    }
  };

  // 변경 여부 (저장 버튼 활성화하려구 만듦)
  const isDirty = useMemo(() => {
    const a = [...initialCategories].sort().join("|");
    const b = [...categories].sort().join("|");
    return a !== b;
  }, [initialCategories, categories]);

  const isValid = categories.length > 0; // 최소 1개는 골라야 해서

  const canSave = !loading && !saving && isValid && isDirty;

  const onPressSave = async () => {
    if (!isDirty || !isValid) return;

    try {
      setSaving(true);
      await changeCategories(categories);

      // 서버 저장에 성공했으면 로컬 캐시를 갱신에서 선호 장르 기반 문구를 추천해줌
      await AsyncStorage.setItem(PREF_GENRES_KEY, JSON.stringify(categories));

      setInitialCategories(categories); // 저장 성공했으니까 초깃값을 바꿔줌
      navigation.goBack();
    } catch (e) {
      console.error(
        "선호 장르 변경 실패",
        e?.response?.status,
        e?.response?.data,
        e,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* 헤더 + 우측 저장 */}
      <View style={styles.headerRow}>
        <AppHeader
          title="선호 장르 변경"
          showBack
          onPressBack={() => navigation.goBack()}
        />
        <Pressable
          onPress={onPressSave}
          disabled={!canSave}
          hitSlop={10}
          style={({ pressed }) => [
            styles.save,
            pressed && canSave && styles.pressed,
            !canSave && styles.saveDisabled,
          ]}
        >
          <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>
            저장
          </Text>
        </Pressable>
      </View>

      {/* 본문 */}
      <View style={styles.content}>
        <View style={styles.chipContainer}>
          {GENRES.map((g) => (
            <Chip
              key={g}
              label={g}
              selected={isSelected(g)}
              onPress={() => toggleCategory(g)}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },

  headerRow: {
    position: "relative",
  },
  save: {
    position: "absolute",
    right: spacing.layoutMargin,
    top: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  saveText: {
    ...typography["heading-4-medium"],
    color: colors.mono[950],
  },
  pressed: { opacity: 0.6 },
  saveDisabled: { opacity: 0.3 },
  saveTextDisabled: { color: colors.mono[400] },

  content: {
    paddingHorizontal: spacing.layoutMargin,
    paddingTop: 27,
  },

  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s,
    rowGap: spacing.m,
  },
});
