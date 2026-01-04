import BookCover from "@components/BookCover";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const MAX_VISIBLE = 5; // 한 번에 바텀 시트에서 보여줄 최대 책 권수
const SHEET_HEIGHT = 470; // 시트 최대 높이 (임의 설정이라 추후 정확한 값으로 변경 할게용 !)
const OPEN_DURATION = 260;
const CLOSE_DURATION = 220;

export default function DayLogsBottomSheet({
  visible,
  dayKey, // "YYYY-MM-DD"
  logs = [], // [{ id, title, cover, time, place }]
  onClose,
}) {
  // 애니메이션 끝날 때까지 Modal 유지
  const [mounted, setMounted] = useState(visible);

  // 바텀 시트가 열릴 때 값 스냅샷
  const [snapDayKey, setSnapDayKey] = useState(null);
  const [snapLogs, setSnapLogs] = useState([]);

  // 기록이 5개 이상이라 스크롤이 필요한지
  const shouldScroll = snapLogs.length >= MAX_VISIBLE;

  // 5개 이상일 때만 높이를 확정해서 ScrollView가 남는 공간을 가져가게 함
  // (1~4개는 자연 높이로 올라오게)
  const sheetStyle = useMemo(
    () => [styles.sheetBase, shouldScroll && styles.sheetFixed],
    [shouldScroll],
  );

  // 시트 슬라이드 / 딤 페이드 애니메이션 값
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const dimOpacity = useRef(new Animated.Value(0)).current;

  // 한 번이라도 스크롤했는지 감지해서 힌트 숨기기
  const [hasScrolled, setHasScrolled] = useState(false);

  const dayNumber = useMemo(() => {
    if (!snapDayKey) return "";
    const [, , d] = snapDayKey.split("-");
    return Number(d || 0);
  }, [snapDayKey]);

  useEffect(() => {
    // 이전 애니메이션 중단 (중복 실행 방지)
    translateY.stopAnimation();
    dimOpacity.stopAnimation();

    if (visible) {
      // 바텀 시트가 열리는 순간 값 고정하기
      setSnapDayKey(dayKey);
      setSnapLogs(logs);

      setMounted(true);

      // 열릴 때마다 스크롤 힌트 상태 초기화
      setHasScrolled(false);

      // 시작 위치 세팅
      translateY.setValue(SHEET_HEIGHT);
      dimOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(dimOpacity, {
          toValue: 1,
          duration: OPEN_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: OPEN_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(dimOpacity, {
          toValue: 0,
          duration: CLOSE_DURATION,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: CLOSE_DURATION,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, mounted, dayKey, logs, translateY, dimOpacity]);

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* 딤 영역 (페이드) */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: dimOpacity }]} />
        </TouchableWithoutFeedback>

        {/* 시트 (슬라이드 업) */}
        <Animated.View style={{ transform: [{ translateY }] }}>
          <View style={sheetStyle}>
            <View style={styles.handle} />

            <Text style={styles.title}>
              <Text style={styles.titleGreen}>{dayNumber}일</Text>
              에는 책을{" "}
              <Text style={styles.titleGreen}>{snapLogs.length}번</Text>{" "}
              읽었어요!
            </Text>

            {/* 5개 이상일 때만 list가 flex:1로 공간을 먹게 */}
            <View style={[styles.listBase, shouldScroll && styles.listFill]}>
              {snapLogs.length === 0 ? (
                <Text style={styles.empty}>
                  기록을 추가하려면 달력에서 날짜를 눌러주세요.
                </Text>
              ) : shouldScroll ? (
                <View style={{ flex: 1 }}>
                  <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={shouldScroll}
                    persistentScrollbar={true}
                    bounces={false}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    scrollIndicatorInsets={{ right: 2 }}
                    contentContainerStyle={styles.listContent}
                    onScrollBeginDrag={() => setHasScrolled(true)}
                    scrollEventThrottle={16}
                  >
                    {snapLogs.map((log) => (
                      <View
                        key={log.id}
                        style={styles.row}
                      >
                        <BookCover
                          uri={log.cover}
                          title={log.title}
                          width={37}
                          height={50}
                          radius={0}
                          backgroundColor={colors.mono[150]} // fallback 배경색
                          textColor={colors.primary[400]} // fallback 글자색
                          fallbackFontSize={12}
                          containerStyle={styles.thumb}
                        />

                        <View style={styles.meta}>
                          <Text style={styles.bookTitle}>{log.title}</Text>
                          <View style={styles.subRow}>
                            <Text style={styles.time}>{log.time}</Text>
                            <View style={[styles.chip]}>
                              <Text style={styles.chipText}>
                                {log.place || "이동중"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  {!hasScrolled && (
                    <View
                      pointerEvents="none"
                      style={styles.scrollHintWrap}
                    >
                      <View style={styles.scrollHintFade} />
                      <View style={styles.scrollHintPill}>
                        <Text style={styles.scrollHintText}>위로 스크롤</Text>
                        <Ionicons
                          name="chevron-up"
                          size={12}
                          color={colors.mono[600]}
                        />
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                // 1~4개는 ScrollView 없이 그냥 렌더 -> 자연 높이로 시트가 “적당히” 올라옴
                <View style={styles.listContent}>
                  {snapLogs.map((log) => (
                    <View
                      key={log.id}
                      style={styles.row}
                    >
                      <BookCover
                        uri={log.cover}
                        title={log.title}
                        width={37}
                        height={50}
                        radius={0}
                        backgroundColor={colors.mono[150]}
                        textColor={colors.primary[400]}
                        fallbackFontSize={12}
                        containerStyle={styles.thumb}
                      />

                      <View style={styles.meta}>
                        <Text style={styles.bookTitle}>{log.title}</Text>
                        <View style={styles.subRow}>
                          <Text style={styles.time}>{log.time}</Text>
                          <View style={styles.chip}>
                            <Text style={styles.chipText}>
                              {log.place || "이동중"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },

  // 딤(오버레이)
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },

  // 기본 시트: 자연 높이 + 최대 높이만 제한
  sheetBase: {
    backgroundColor: colors.mono[0],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: spacing.xxl,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,

    maxHeight: SHEET_HEIGHT,
  },

  // 5개 이상일 때만 높이 확정
  sheetFixed: {
    height: SHEET_HEIGHT,
  },

  // 바텀시트 상단에 있는 핸들바
  handle: {
    alignSelf: "center",
    width: 56,
    height: 4,
    borderRadius: 100,
    backgroundColor: colors.mono[150],
    marginBottom: 14,
  },

  // 바텀시트 제목 텍스트
  title: { fontSize: 20, fontWeight: "700", color: colors.mono[950] },

  // 제목에서 초록색으로 표기되는 텍스트 (며칠, 몇번)
  titleGreen: {
    color: colors.primary[400],
  },

  // 기본 list
  listBase: {
    marginTop: 20,
  },

  // 5개 이상일 때만 남는 공간 채움
  listFill: {
    flex: 1,
  },

  listContent: {
    gap: 20,
    paddingBottom: 4,
  },

  // 로그가 없을 때 안내 문구
  empty: { fontSize: 14, color: "#666" },

  // 로그 한 줄(row) 레이아웃(표지 + 정보 영역)
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // 책 표지 썸네일 박스(이미지/대체박스가 들어가는 틀)
  thumb: {
    width: 37,
    height: 50,
  },

  // 썸네일 오른쪽 정보 영역(제목 + 시간/장소)
  meta: { flex: 1, gap: 2 },

  // 책 제목 텍스트
  bookTitle: { ...typography["body-1-bold"], color: colors.mono[950] },

  // 시간 + 장소 칩이 나란히 있는 줄
  subRow: { flexDirection: "row", alignItems: "center", gap: 10 },

  // 시간 텍스트
  time: { ...typography["body-1-regular"], color: colors.mono[950] },

  // 장소 칩(초록 배경 pill)
  chip: {
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 3,
    maxWidth: 39,
    alignItems: "center",
    backgroundColor: colors.primary[400],
  },

  // 장소 칩 안의 글자(흰색)
  chipText: { color: colors.mono[0], fontSize: 10, fontWeight: "700" },

  // 스크롤 힌트 UI
  scrollHintWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },

  // 아래쪽 페이드 (스크롤이 더 있다는 느낌을 주고 싶어서 넣어 봤어요 ..!!)
  scrollHintFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 48,
    backgroundColor: "rgba(255,255,255,0.85)",
  },

  // 힌트 원형
  scrollHintPill: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.mono[100],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  // 힌트 텍스트
  scrollHintText: { ...typography["detail-regular"], color: colors.mono[600] },

  // 힌트 화살표
  scrollHintArrow: { ...typography["detail-bold"], color: colors.mono[600] },
});
