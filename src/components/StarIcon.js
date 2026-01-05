import React, { useMemo } from "react";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

/**
 * variant: "full" | "half" | "empty"
 */
export default function StarIcon({
  size = 44,
  color = "#426B1F",
  emptyColor = "#C6C6C6",
  variant = "full",
}) {
  const gradientId = useMemo(
    () => `starGrad-${Math.random().toString(36).slice(2, 10)}`,
    [],
  );

  const fill =
    variant === "half"
      ? `url(#${gradientId})`
      : variant === "empty"
        ? emptyColor
        : color;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
    >
      {variant === "half" && (
        <Defs>
          <LinearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="60"
            y2="0"
          >
            {/* 왼쪽 50%: 채움 */}
            <Stop
              offset={0}
              stopColor={color}
            />
            <Stop
              offset={0.5}
              stopColor={color}
            />

            {/* 오른쪽 50%: 빈색 */}
            <Stop
              offset={0.5}
              stopColor={emptyColor}
            />
            <Stop
              offset={1}
              stopColor={emptyColor}
            />
          </LinearGradient>
        </Defs>
      )}

      <Path
        d="M27.1468 8.78116C28.0449 6.01722 31.9551 6.01722 32.8532 8.78115L36.0619 18.6565C36.4635 19.8926 37.6154 20.7295 38.915 20.7295H49.2986C52.2048 20.7295 53.4131 24.4483 51.062 26.1565L42.6615 32.2599C41.61 33.0238 41.1701 34.3779 41.5717 35.614L44.7804 45.4894C45.6784 48.2533 42.515 50.5517 40.1639 48.8435L31.7634 42.7401C30.7119 41.9762 29.2881 41.9762 28.2366 42.7401L19.8361 48.8435C17.485 50.5517 14.3216 48.2533 15.2196 45.4894L18.4283 35.614C18.8299 34.3779 18.39 33.0238 17.3385 32.2599L8.938 26.1565C6.58686 24.4483 7.79518 20.7295 10.7014 20.7295H21.0849C22.3846 20.7295 23.5365 19.8926 23.9381 18.6565L27.1468 8.78116Z"
        fill={fill}
      />
    </Svg>
  );
}
