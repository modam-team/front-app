// src/components/PlusOverlay.js
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import colors from '../theme/colors';

const DEFAULT_OPTIONS = ['집', '카페', '도서관', '기타'];
const SIZE = 78;                   // 원형 버튼 크기

export default function PlusOverlay({
  visible,
  onClose,
  onSelect,
  title = '책을 읽을 장소를 선택해주세요',
  options = DEFAULT_OPTIONS,
}) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}   // Android 백버튼
      statusBarTranslucent
    >
      <View style={styles.root}>
        {/* 배경 딤 */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* 콘텐츠 레이어 */}
        <View style={styles.content} pointerEvents="box-none">
          {/* === Figma Frame (196 x 193, column, align-start, gap: 43) === */}
          <View style={styles.frame}>
            {/* 캡션 */}
            <View style={styles.captionWrap}>
              <Text style={styles.caption} numberOfLines={2}>
                {title}
              </Text>
            </View>

            {/* 2 x 2 원형 버튼 영역 */}
            <View style={styles.grid}>
              {options.map((label, idx) => (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.circle,
                    // gap 폴백: 열 간격은 space-between으로, 행 간격은 marginTop으로 처리
                    idx >= 2 && styles.circleRowGap,
                  ]}
                  onPress={() => onSelect?.(label)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`장소: ${label}`}
                >
                  <Text style={styles.circleText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* === /Frame === */}
        </View>
      </View>
    </Modal>
  );
}

const overlayColor = colors?.overlay ?? 'rgba(0,0,0,0.55)';

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: Platform.OS === 'ios' ? 8 : 0 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: overlayColor,
    zIndex: 1,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  /* ========= Figma Frame 2116929954 =========
     - display: flex
     - flex-direction: column
     - align-items: flex-start
     - padding: 0
     - gap: 43px
     - width: 196px
     - height: 193px
  =========================================== */
  frame: {
    width: 196,
    height: 193,
    flexDirection: 'column',
    alignItems: 'flex-start',
    // gap: 43, // RN 일부 버전 미지원 → 아래 캡션과 그리드 사이 marginTop으로 폴백
    padding: 0,
  },

  // 캡션
  captionWrap: {
    // 첫 요소이므로 gap 불필요
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'left',
  },

  // grid 영역: 프레임 내 두 번째 요소 → gap 43 적용(폴백)
  // 프레임 상에서의 gap을 여기 marginTop으로 대체
  grid: {
    marginTop: 43,              // gap: 43px 폴백
    width: '100%',              // 프레임 너비 196px에 맞춤
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // 좌/우 균등 배치
  },

  // 원형 버튼
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    // 좌/우 간격은 space-between으로 해결
  },
  // 두 번째 행(인덱스 2,3)에만 세로 간격 부여(프레임 196 높이에 맞게 24 정도가 적당)
  circleRowGap: {
    marginTop: 24,
  },
  circleText: { color: colors?.text ?? '#111827', fontWeight: '700' },
});
