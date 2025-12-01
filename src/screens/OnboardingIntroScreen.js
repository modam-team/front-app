import { ONBOARDING_QUOTES } from "@constants/onboardingQuotes";
import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import { splitToLines } from "@utils/textSplit";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function OnboardingIntroScreen({ navigation }) {
  // 최초 렌더링 시 한 번만 랜덤으로 문구 선택
  const quote = useMemo(() => {
    const idx = Math.floor(Math.random() * ONBOARDING_QUOTES.length);
    return ONBOARDING_QUOTES[idx];
  }, []);

  // 문구를 여러 줄로 나누기
  const lines = useMemo(() => splitToLines(quote.text, 20), [quote.text]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("OnboardingLogin");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {/* 나중에 로고 들어갈 자리 !! */}
        <Text style={styles.title}>모담 로고</Text>

        <Text style={styles.text}>
          {lines.map((line, i) => (
            <Text key={i}>
              {line}
              {i !== lines.length - 1 && "\n"}
            </Text>
          ))}
        </Text>
        <Text style={styles.book}>{quote.book}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
    paddingHorizontal: spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
  },
  title: {
    ...typography["heading-1-medium"],
    textAlign: "center",
    marginBottom: 45,
    color: colors.mono[1000],
  },
  text: {
    ...typography["heading-4-medium"],
    textAlign: "left",
    color: colors.mono[1000],
  },
  book: {
    marginTop: 35,
    alignSelf: "flex-end",
    ...typography["body-2-regular"],
    color: colors.mono[1000],
  },
});
