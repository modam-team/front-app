import { colors } from "@theme/colors";
import { radius } from "@theme/radius";
import { spacing } from "@theme/spacing";
import { typography } from "@theme/typography";
import React, { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

/**
 * Tag 컴포넌트
 * - variant: "square" | "round"
 *   - square: filled 태그
 *   - round: outline 태그
 * - size: "small" | "medium" | "large"
 */
function Tag({ label, variant = "square", size = "medium", onPress, style }) {
  const sizeStyle = SIZE_STYLE[size];

  const containerStyle = useMemo(() => {
    const base = [
      styles.base,
      {
        paddingHorizontal: sizeStyle.px,
        paddingVertical: sizeStyle.py,
        borderRadius: variant === "round" ? 999 : radius[100],
      },
    ];

    if (variant === "square") {
      // filled
      base.push({
        backgroundColor: colors.primary[300],
        borderWidth: 0,
      });
    } else {
      // round (outline)
      base.push({
        backgroundColor: colors.mono[0],
        borderWidth: 1,
        borderColor: colors.mono[600],
      });
    }

    return base;
  }, [variant, sizeStyle]);

  const textStyle = useMemo(() => {
    return [
      styles.textBase,
      sizeStyle,
      {
        color: variant === "square" ? colors.mono[0] : colors.mono[600],
      },
    ];
  }, [variant, sizeStyle]);

  return (
    <View style={[containerStyle, style]}>
      <Text
        style={textStyle}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const SIZE_STYLE = {
  small: {
    px: 6,
    py: 2,
    ...typography["detail-2-regular"],
  },
  medium: {
    px: 6,
    py: 2,
    ...typography["detail-regular"],
  },
  large: {
    px: spacing.s,
    py: spacing.xs,
    ...typography["body-2-regular"],
  },
};

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    justifyContent: "center",
    alignItems: "center",
  },

  textBase: {
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});

export default memo(Tag);
