import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

// 리포트 화면에서 공통으로 사용하는 섹션 헤더 컴포넌트
function ReportSectionHeader({
  month,
  monthVisible = true,
  title,
  caption,
  variant = "current",
  monthSuffix = "월",
  containerStyle,
}) {
  // 이번 달인지 지난 달인지에 따라 텍스트 색을 다르게 적용
  const styleSet =
    variant === "current"
      ? {
          title: colors.mono[0],
          caption: colors.primary[50],
          month: colors.mono[0],
        }
      : {
          title: colors.mono[950],
          caption: colors.mono[950],
          month: colors.primary[500],
        };

  // 몇 월인지 보여줄지(ex. 11월 취향 분석) or 섹션 제목만 보여줄지(ex. 독서 통계)
  const showMonth = monthVisible && typeof month === "number";

  return (
    <View style={[styles.header, containerStyle]}>
      <View style={styles.titleRow}>
        {/* 월을 보여줄지 말지 결정 */}
        {showMonth ? (
          <Text style={[styles.monthText, { color: styleSet.month }]}>
            {month}
            {monthSuffix}
          </Text>
        ) : null}
        {/* 섹션 제목 */}
        <Text style={[styles.sectionTitle, { color: styleSet.title }]}>
          {title}
        </Text>
      </View>

      {/* 캡션이 있다면 보여줌 */}
      {caption ? (
        <Text style={[styles.caption, { color: styleSet.caption }]}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

export default memo(ReportSectionHeader);

const styles = StyleSheet.create({
  // 섹션 헤더 아래에 여백 주기
  header: {
    marginBottom: spacing.m,
  },

  // ㅇㅇ월 + 제목 컨테이너
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  // ㅇㅇ월 텍스트
  monthText: {
    fontSize: 28,
    fontWeight: "600",
    marginRight: 12,
  },

  // 섹션 제목 텍스트
  sectionTitle: {
    fontSize: 28,
    fontWeight: "600",
  },

  // 캡션
  caption: {
    ...typography["body-1-regular"],
  },
});
