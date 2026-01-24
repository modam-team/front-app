import ModamLogo from "../img/icons.png";
import { ONBOARDING_QUOTES } from "@constants/onboardingQuotes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "@theme/colors";
import { typography } from "@theme/typography";
import { pickOnboardingQuote } from "@utils/pickOnboardingQuotes";
import { splitToLines } from "@utils/textSplit";
import React, { useEffect, useMemo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const PREF_GENRES_KEY = "preferredGenres";

export default function OnboardingIntroScreen({ navigation }) {
  const [quote, setQuote] = React.useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREF_GENRES_KEY);
        const preferredGenres = raw ? JSON.parse(raw) : [];
        const q = pickOnboardingQuote(preferredGenres);
        if (alive) setQuote(q);
      } catch {
        const q = pickOnboardingQuote([]);
        if (alive) setQuote(q);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("AuthGate");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation]);

  const lines = useMemo(() => {
    if (!quote?.text) return [];
    return splitToLines(quote.text, 20);
  }, [quote?.text]);

  // quote 없으면 먼저 렌더 종료
  if (!quote) {
    return (
      <View style={styles.root}>
        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <Image
              source={ModamLogo}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Image
            source={ModamLogo}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

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
    paddingHorizontal: 58,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",
  },
  logoWrap: { alignItems: "center", marginBottom: 45 },
  logoImage: {
    width: 140,
    height: 140,
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
