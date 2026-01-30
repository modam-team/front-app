import { colors } from "@theme/colors";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { memo, useMemo } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, Mask, Rect } from "react-native-svg";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

function TutorialOverlay({
  visible,
  highlightRect,
  title,
  description,
  onNext,
  onSkip,
  nextLabel = "다음",
}) {
  const highlightShape = useMemo(() => {
    if (!highlightRect) return null;
    const horizontalExpand = 32;
    const x = Math.max(8, highlightRect.x - horizontalExpand);
    const y = Math.max(0, highlightRect.y);
    const w = Math.min(
      SCREEN_W - 16,
      Math.max(0, highlightRect.width + horizontalExpand * 2),
    );
    const h = Math.max(0, highlightRect.height);
    const radius = Math.min(16, Math.max(8, Math.min(w, h) / 2));
    return { x, y, w, h, radius };
  }, [highlightRect]);

  const tooltipStyle = useMemo(() => {
    if (!highlightRect) return null;
    const padding = 16;
    const tooltipW = SCREEN_W - padding * 2;
    const height = 40;
    const preferredTop = highlightRect.y + highlightRect.height + 12;
    const fallbackTop = highlightRect.y - height - 12;
    const top =
      preferredTop + height < SCREEN_H - 12 ? preferredTop : fallbackTop;
    return {
      left: padding,
      top,
      width: tooltipW,
      minHeight: height,
    };
  }, [highlightRect]);

  const connectorStyle = useMemo(() => {
    if (!highlightRect || !tooltipStyle) return null;
    const cx = highlightRect.x + highlightRect.width / 2;
    const tooltipTop = tooltipStyle.top || 0;
    const tooltipBottom = tooltipTop + (tooltipStyle.minHeight || 0);
    const highlightTop = highlightRect.y;
    const highlightBottom = highlightRect.y + highlightRect.height;
    const lineTop =
      tooltipTop > highlightTop ? highlightBottom : tooltipBottom;
    const lineBottom =
      tooltipTop > highlightTop ? tooltipTop : highlightTop;
    const height = Math.max(0, lineBottom - lineTop);
    return { left: cx - 1, top: lineTop, height };
  }, [highlightRect, tooltipStyle]);

  if (!visible || !highlightRect || !highlightShape) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.root}>
        <Svg
          style={StyleSheet.absoluteFill}
          width={SCREEN_W}
          height={SCREEN_H}
        >
          <Defs>
            <Mask id="spotlightMask">
              <Rect
                x={0}
                y={0}
                width={SCREEN_W}
                height={SCREEN_H}
                fill="#fff"
              />
              <Rect
                x={highlightShape.x}
                y={highlightShape.y}
                width={highlightShape.w}
                height={highlightShape.h}
                rx={highlightShape.radius}
                ry={highlightShape.radius}
                fill="#000"
              />
            </Mask>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={SCREEN_W}
            height={SCREEN_H}
            fill="rgba(0,0,0,0.55)"
            mask="url(#spotlightMask)"
          />
          <Rect
            x={highlightShape.x}
            y={highlightShape.y}
            width={highlightShape.w}
            height={highlightShape.h}
            rx={highlightShape.radius}
            ry={highlightShape.radius}
            stroke={colors.mono[0]}
            strokeWidth={2}
            fill="transparent"
          />
        </Svg>

        {connectorStyle?.height > 0 && (
          <View
            style={[
              styles.connector,
              {
                left: connectorStyle.left,
                top: connectorStyle.top,
                height: connectorStyle.height,
              },
            ]}
          />
        )}

        <View style={[styles.tooltip, tooltipStyle]}>
          <View style={styles.bannerRow}>
            <View style={styles.bannerTextWrap}>
              {!!title && (
                <Text
                  style={styles.title}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              )}
              {!!description && (
                <Text
                  style={styles.desc}
                  numberOfLines={1}
                >
                  {description}
                </Text>
              )}
            </View>
            <View style={styles.actions}>
            {onSkip && (
              <Pressable
                onPress={onSkip}
                style={styles.skipBtn}
              >
                <Text style={styles.skipText}>건너뛰기</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onNext}
              style={styles.nextBtn}
            >
              <Text style={styles.nextText}>{nextLabel}</Text>
            </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dim: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: spacing.m,
    paddingVertical: 6,
    borderRadius: 12,
  },
  connector: {
    position: "absolute",
    width: 2,
    backgroundColor: colors.mono[0],
    opacity: 0.8,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  bannerTextWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography["body-2-medium"],
    color: colors.mono[0],
  },
  desc: {
    fontSize: 12,
    color: colors.mono[0],
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipText: {
    fontSize: 12,
    color: colors.mono[0],
  },
  nextBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  nextText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mono[0],
  },
});

export default memo(TutorialOverlay);
