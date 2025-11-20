import { fetchMonthlyReport } from "@apis/reportApi";
import Summary from "@components/report/Summary";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { shadow } from "@theme/shadow";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ReportScreen() {
  // 현재 날짜 기준 기본 연도랑 월 설정
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // 일단 임시 더미 데이터에서 받아온 리포트 데이터
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 연도나 월을 변경하면 자동으로 리포트 재조회하도록
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchMonthlyReport({ year, month });
        setData(res);
      } catch (e) {
        // 에러 UI 나중에 추가할 거면 여기다가 추가하기 !!
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year, month]);

  if (loading || !data) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator
          size="large"
          color={colors.primary[500]}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Summary summary={data.summary} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.DEFAULT,
  },
  content: {
    padding: spacing.l,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.DEFAULT,
  },
});
