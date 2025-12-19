// src/screens/HomeScreen.js
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import colors from "../theme/legacyColors";

const green = "#608540";
const lightGreen = "#d7eec4";
const mutedGreen = "#9fb37b";

function Rating({ value }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.ratingRow}>
      {stars.map((star) => {
        const diff = value - star;
        const isFull = diff >= 0;
        const isHalf = diff >= -0.5 && diff < 0;
        return (
          <View key={star} style={styles.starBox}>
            <Text
              style={[
                styles.star,
                {
                  color: isFull ? green : isHalf ? mutedGreen : "#d1d5db",
                },
              ]}
            >
              ★
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function BookCard({ title, author, tags, rating }) {
  return (
    <View style={styles.bookCard}>
      <View style={styles.bookCover}>
        <Text style={styles.coverText}>{title.slice(0, 2)}</Text>
      </View>
      <View style={styles.bookMeta}>
        <Text style={styles.bookTitle}>{title}</Text>
        <Text style={styles.bookAuthor}>{author}</Text>
        <Rating value={rating} />
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.heart}>
        <Text style={styles.heartText}>♡</Text>
      </View>
    </View>
  );
}

function Calendar({ year, month, onPrev, onNext, onYearChange }) {
  const weeks = useMemo(() => {
    const first = new Date(year, month - 1, 1);
    const last = new Date(year, month, 0).getDate();
    const startIndex = (first.getDay() + 6) % 7; // monday start
    const cells = [];
    for (let i = 0; i < startIndex; i += 1) cells.push(null);
    for (let d = 1; d <= last; d += 1) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const result = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  }, [year, month]);

  return (
    <View style={styles.calendarCard}>
      <View style={styles.yearRow}>
        <TouchableOpacity
          style={styles.yearButton}
          onPress={() => onYearChange?.("open")}
          hitSlop={8}
        >
          <Text style={styles.yearText}>{year}</Text>
          <Text style={styles.caretText}>⌄</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={onPrev} hitSlop={12}>
          <Text style={styles.calNav}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.calTitle}>{`${month}월`}</Text>
        <TouchableOpacity onPress={onNext} hitSlop={12}>
          <Text style={styles.calNav}>{">"}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.weekRow}>
        {["월", "화", "수", "목", "금", "토", "일"].map((w) => (
          <Text key={w} style={styles.weekLabel}>
            {w}
          </Text>
        ))}
      </View>
      {weeks.map((week, idx) => (
        <View key={idx} style={styles.dayRow}>
          {week.map((day, dIdx) => (
            <View key={dIdx} style={styles.dayCell}>
              {day ? (
                <Text style={styles.dayText}>{day}</Text>
              ) : (
                <Text style={styles.dayTextMuted}> </Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const [month, setMonth] = useState(12);
  const [year, setYear] = useState(2025);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const yearOptions = useMemo(() => {
    const start = Math.max(currentYear, year);
    return Array.from({ length: 4 }, (_, idx) => start - idx);
  }, [currentYear, year]);

  const prev = () =>
    setMonth((m) => (m === 1 ? (setYear((y) => y - 1), 12) : m - 1));
  const next = () =>
    setMonth((m) => (m === 12 ? (setYear((y) => y + 1), 1) : m + 1));

  const friends = [
    { name: "닉네임", color: "#f4d7d9" },
    { name: "닉네임", color: "#d7eec4" },
    { name: "닉네임", color: "#d7eec4" },
    { name: "닉네임", color: "#d7eec4" },
    { name: "닉네임", color: "#d7eec4" },
  ];

  const recs = [
    {
      title: "디자인의 디자인",
      author: "하라 켄야 / 안그라픽스",
      rating: 0,
      tags: ["텍스트", "텍스트", "텍스트"],
    },
    {
      title: "디자인의 디자인",
      author: "하라 켄야 / 안그라픽스",
      rating: 0,
      tags: ["텍스트", "텍스트", "텍스트"],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>modam</Text>
        </View>

        <View style={styles.friendsStrip}>
          {friends.map((f, idx) => (
            <View key={idx} style={styles.friendItem}>
              <View style={[styles.avatar, { backgroundColor: f.color }]} />
              <Text
                style={[
                  styles.avatarName,
                  idx === 0 && styles.avatarNameBold,
                ]}
              >
                {f.name}
              </Text>
            </View>
          ))}
          <View style={styles.addCircle}>
            <Text style={styles.addPlus}>＋</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressPercent}>120%</Text>
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>n권을 읽었어요</Text>
              <Text style={styles.goalTarget}>목표 n권</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: "60%" }]} />
            <View style={styles.progressMarker} />
          </View>
        </View>

        <Calendar
          year={year}
          month={month}
          onPrev={prev}
          onNext={next}
          onYearChange={(val) => {
            if (val === "open") {
              setYearPickerOpen(true);
              return;
            }
            setYear(val);
          }}
        />

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>00님께 추천하는 책이에요</Text>
            <Text style={styles.sectionHint}>클릭하면 줄거리를 볼 수 있어요</Text>
          </View>
          <View style={styles.recList}>
            {recs.map((book, idx) => (
              <BookCard key={idx} {...book} />
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={yearPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setYearPickerOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setYearPickerOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.yearSheet}>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>날짜</Text>
                </View>
                <View style={styles.yearList}>
                  {yearOptions.map((y) => (
                    <Pressable
                      key={y}
                      style={styles.yearRowItem}
                      onPress={() => {
                        setYear(y);
                        setYearPickerOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.yearOptionText,
                          y === year && styles.yearOptionTextActive,
                        ]}
                      >
                        {`${y}년`}
                      </Text>
                      {y === year ? (
                        <Text style={styles.yearCheck}>✓</Text>
                      ) : (
                        <View style={styles.yearCheckPlaceholder} />
                      )}
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  style={styles.sheetClose}
                  onPress={() => setYearPickerOpen(false)}
                >
                  <Text style={styles.sheetCloseText}>닫기</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  logo: { color: green, fontSize: 20, fontWeight: "800" },
  friendsStrip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 2,
    alignSelf: "center",
  },
  friendItem: { alignItems: "center", width: 49 },
  avatar: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
  },
  avatarName: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "500",
    color: colors.text,
    textAlign: "center",
    width: 49,
  },
  avatarNameBold: { fontWeight: "700" },
  addCircle: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    backgroundColor: green,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3f5d2c",
  },
  addPlus: { color: "#fff", fontSize: 24, fontWeight: "700" },
  progressCard: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  progressHeader: { flexDirection: "column", gap: 8 },
  progressPercent: {
    alignSelf: "flex-end",
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  goalLabel: { fontSize: 14, fontWeight: "600", color: colors.text },
  goalTarget: { fontSize: 12, color: colors.text },
  progressTrack: {
    marginTop: 8,
    backgroundColor: "#e5e5e5",
    height: 12,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: green,
    borderRadius: 12,
  },
  progressMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: green,
    position: "absolute",
    right: 12,
    top: -2,
  },
  calendarCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  yearText: { fontSize: 16, fontWeight: "600", color: colors.text },
  yearButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  caretText: { fontSize: 14, color: colors.text, marginTop: 2 },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 6,
    width: 328,
    alignSelf: "center",
  },
  calTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    width: 60,
    textAlign: "center",
  },
  calNav: { fontSize: 24, color: colors.text, fontWeight: "500", paddingHorizontal: 4 },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekLabel: { width: 32, textAlign: "center", color: colors.text },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  dayCell: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { color: colors.text, fontWeight: "700", fontSize: 16 },
  dayTextMuted: { color: "#d1d5db" },
  yearDropdown: {
    display: "none",
  },
  yearItem: { paddingVertical: 6, paddingHorizontal: 12 },
  yearItemText: { fontSize: 14, color: colors.text },
  section: { marginTop: 14, paddingHorizontal: 16 },
  sectionHead: { gap: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  sectionHint: { fontSize: 12, color: colors.subtext },
  recList: { marginTop: 12, gap: 12 },
  bookCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  bookCover: {
    width: 84,
    height: 113,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverText: { fontWeight: "700", fontSize: 16, color: colors.text },
  bookMeta: { flex: 1, marginLeft: 12, gap: 6 },
  bookTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  bookAuthor: { fontSize: 12, color: colors.subtext },
  ratingRow: { flexDirection: "row", gap: 4 },
  starBox: { width: 20, alignItems: "center" },
  star: { fontSize: 16 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagPill: {
    backgroundColor: lightGreen,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagText: { fontSize: 12, color: green, fontWeight: "700" },
  heart: { paddingLeft: 8, paddingTop: 4 },
  heartText: { fontSize: 18, color: "#c6c6c6" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-end",
  },
  yearSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 56,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e5e5",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
  yearList: { paddingVertical: 8, gap: 14 },
  yearRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  yearOptionText: { fontSize: 16, color: colors.text },
  yearOptionTextActive: { color: green, fontWeight: "700" },
  yearCheck: { fontSize: 18, color: green, fontWeight: "700" },
  yearCheckPlaceholder: { width: 18 },
  sheetClose: { alignSelf: "center", marginTop: 10 },
  sheetCloseText: { fontSize: 18, fontWeight: "600", color: colors.text },
});
