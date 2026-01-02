import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Button
 * - variant: "primary" | "secondary" | "error"
 * - tone: "fill" | "outline" | "ghost"
 * - size: "small" | "medium" | "large" | "xlarge"
 * - disabled: boolean
 * - leftIcon/rightIcon: ReactNode (예: <MaterialIcons .../>)
 */
export default function Button({
  label,
  onPress,
  variant = "primary",
  tone = "fill",
  size = "medium",
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
}) {
  const base = getButtonStyle({ variant, tone, size, disabled });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        base.container,
        fullWidth && styles.fullWidth,
        pressed && !disabled && base.pressed,
        style,
      ]}
    >
      <View style={styles.row}>
        {leftIcon ? (
          <View style={[styles.icon, styles.leftIcon]}>{leftIcon}</View>
        ) : null}

        <Text
          numberOfLines={1}
          style={[styles.textBase, base.text, textStyle]}
        >
          {label}
        </Text>

        {rightIcon ? (
          <View style={[styles.icon, styles.rightIcon]}>{rightIcon}</View>
        ) : null}
      </View>
    </Pressable>
  );
}

//Style Resolver
function getButtonStyle({ variant, tone, size, disabled }) {
  const palette = getPalette(variant);

  const sizeSet = getSizeSet(size);

  // 기본값들
  let baseContainer = {
    ...(sizeSet.height != null ? { height: sizeSet.height } : {}),
    ...(sizeSet.minHeight != null ? { minHeight: sizeSet.minHeight } : {}),
    paddingHorizontal: sizeSet.px,
    ...(sizeSet.py != null ? { paddingVertical: sizeSet.py } : {}),
    borderRadius: sizeSet.borderRadius, // pill
  };

  const baseText = {
    ...sizeSet.text,
  };

  // 상태: disabled
  if (disabled) {
    if (tone === "fill") {
      return {
        container: {
          ...baseContainer,
          backgroundColor: withOpacity(palette.fill, 0.32),
        },
        text: {
          ...baseText,
          color: palette.onFill,
        },
        pressed: {},
      };
    }

    if (tone === "outline") {
      return {
        container: {
          ...baseContainer,
          backgroundColor: withOpacity(palette.outlineBg, 0.32),
          borderWidth: 1,
          borderColor: withOpacity(palette.outlineBorder, 0.32),
        },
        text: {
          ...baseText,
          color: withOpacity(palette.outlineText, 0.32),
        },
        pressed: {},
      };
    }

    // ghost
    return {
      container: {
        ...baseContainer,
        backgroundColor: "transparent",
      },
      text: {
        ...baseText,
        color: withOpacity(palette.ghostText, 0.32),
      },
      pressed: {},
    };
  }

  // 기본 상태
  if (tone === "fill") {
    return {
      container: {
        ...baseContainer,
        backgroundColor: palette.fill,
      },
      text: {
        ...baseText,
        color: palette.onFill,
      },
      pressed: {
        backgroundColor: palette.fillPressed,
      },
    };
  }

  if (tone === "outline") {
    return {
      container: {
        ...baseContainer,
        backgroundColor: palette.outlineBg,
        borderWidth: 1,
        borderColor: palette.outlineBorder,
      },
      text: {
        ...baseText,
        color: palette.outlineText,
      },
      pressed: {
        backgroundColor: palette.outlinePressedBg,
        borderColor: palette.outlinePressedBorder,
      },
    };
  }

  // ghost
  return {
    container: {
      ...baseContainer,
      backgroundColor: "transparent",
    },
    text: {
      ...baseText,
      color: palette.ghostText,
    },
    pressed: {
      backgroundColor: palette.ghostPressedBg,
    },
  };
}

function getSizeSet(size) {
  switch (size) {
    case "small":
      return {
        minHeight: 24,
        borderRadius: radius[400],
        px: spacing.s,
        py: 2,
        text: typography["body-2-regular"],
      };
    case "large":
      return {
        height: 40,
        borderRadius: radius[400],
        px: spacing.m,
        text: typography["body-1-regular"],
      };
    case "xlarge":
      return {
        height: 48,
        borderRadius: radius[400],
        px: spacing.l,
        text: typography["heading-4-medium"],
      };
    case "medium":
    default:
      return {
        height: 32,
        borderRadius: radius[400],
        px: 12,
        text: typography["body-1-regular"],
      };
  }
}

function withOpacity(hex, opacity) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getPalette(variant) {
  const primary = {
    // fill
    fill: colors.primary[500], // default
    fillPressed: colors.primary[700], // pressed
    onFill: colors.mono[0], // 글자색

    // outline
    outlineBg: colors.primary[100], // default
    outlineBorder: colors.primary[500], // 테두리
    outlineText: colors.primary[500], // 글자색
    outlinePressedBg: colors.primary[300], // pressed 색
    outlinePressedText: colors.primary[700], // pregressed 글자색
    outlinePressedBorder: colors.primary[700], // pressed 테두리 색

    // ghost
    ghostText: colors.primary[500], // default 글자색
    ghostPressedText: colors.primary[700], // pressed 글자색
    ghostPressedBg: colors.mono[0],
  };

  const secondary = {
    fill: colors.mono[600],
    fillPressed: colors.mono[800],
    onFill: colors.mono[0],

    // outline
    outlineBg: colors.mono[150], // default
    outlineBorder: colors.mono[600], // 테두리
    outlineText: colors.mono[600], // 글자색
    outlinePressedBg: colors.mono[500], // pressed 색
    outlinePressedText: colors.mono[800], // pressed 글자색
    outlinePressedBorder: colors.mono[800], // pressed 테두리 색

    // ghost
    ghostPressedBg: colors.mono[0],
    ghostText: colors.mono[600], // default 글자색
    ghostPressedText: colors.mono[800], // pressed 글자색
  };

  const error = {
    fill: colors.warning.medium,
    onFill: colors.mono[0],
    fillPressed: colors.warning.medium, // 변화 없게 맞춰 두기만 함

    outlineBg: colors.warning.light,
    outlineBorder: colors.warning.medium,
    outlineText: colors.warning.medium,
    outlinePressedBg: colors.warning.light, // 변화 없게 맞춰 두기만 함
    outlinePressedBorder: colors.warning.medium, // 변화 없게 맞춰 두기만 함

    ghostText: colors.warning.medium,
    ghostPressedBg: "transparent", // 변화 없게 맞춰 두기만 함
  };

  if (variant === "secondary") return secondary;
  if (variant === "error") return error;
  return primary;
}

// Base styles

const styles = StyleSheet.create({
  base: {
    justifyContent: "center",
    alignItems: "center",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  textBase: {
    includeFontPadding: false,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
  leftIcon: {
    marginRight: 4,
  },
  rightIcon: {
    marginLeft: 4,
  },
});
