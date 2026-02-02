/**
 * SkeletonBar Component
 *
 * Animated loading skeleton placeholder
 */

import React, { memo } from "react";
import { DimensionValue, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from "react-native-reanimated";
import { Colors } from "@/app/utils/colors";

interface SkeletonBarProps {
  width: DimensionValue;
  height: number;
  style?: ViewStyle;
}

export const SkeletonBar = memo(function SkeletonBar({
  width,
  height,
  style,
}: SkeletonBarProps) {
  const pulse = useSharedValue(0.6);

  // Start animation
  React.useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: 8,
          backgroundColor: Colors.backgroundLight,
          marginVertical: 6,
        },
        animatedStyle,
        style,
      ]}
    />
  );
});

export default SkeletonBar;
