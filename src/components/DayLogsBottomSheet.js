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
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const SHEET_HEIGHT = 360; // 시트 최대 높이 (임의 설정이라 추후 정확한 값으로 변경 할게용 !)
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

  // 시트 슬라이드 / 딤 페이드 애니메이션 값
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const dimOpacity = useRef(new Animated.Value(0)).current;

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
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />

              <Text style={styles.title}>
                <Text style={styles.titleGreen}>{dayNumber}일</Text>
                에는 책을{" "}
                <Text style={styles.titleGreen}>{snapLogs.length}번</Text>{" "}
                읽었어요!
              </Text>

              <View style={styles.list}>
                {snapLogs.length === 0 ? (
                  <Text style={styles.empty}>
                    기록을 추가하려면 달력에서 날짜를 눌러주세요.
                  </Text>
                ) : (
                  snapLogs.map((log) => (
                    <View
                      key={log.id}
                      style={styles.row}
                    >
                      <View style={styles.thumb}>
                        {log.cover ? (
                          <Image
                            source={{ uri: log.cover }}
                            style={styles.thumbImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.thumbFallback}>
                            <Text style={styles.thumbText}>
                              {log.title?.slice(0, 2) || "책"}
                            </Text>
                          </View>
                        )}
                      </View>

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
                  ))
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
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

  // 바텀시트 컨테이너
  sheet: {
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
    gap: 0,
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

  // 로그 리스트 전체 래퍼
  list: { gap: 20, marginTop: 20 },

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
    overflow: "hidden",
  },

  // 실제 책 표지 이미지 스타일
  thumbImg: { width: "100%", height: "100%" },

  // 표지 이미지가 없을 때(대체 박스) 중앙 정렬 영역
  thumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mono[150],
  },

  // 표지 없을 때 대체 텍스트(책 제목 앞 1~2글자)
  thumbText: { fontWeight: "700", color: "#426b1f" },

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
    width: 39,
    alignItems: "center",
    backgroundColor: colors.primary[400],
  },

  // 장소 칩 안의 글자(흰색)
  chipText: { color: colors.mono[0], fontSize: 10, fontWeight: "700" },
});
