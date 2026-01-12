/**
 * UI Components - Reusable, generic UI components
 */
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "../../utils/colors";

/**
 * Loading Spinner component
 */
export function LoadingSpinner({
  size = "large",
  color = Colors.primary,
  text,
}: {
  size?: "small" | "large";
  color?: string;
  text?: string;
}) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.loadingText}>{text}</Text>}
    </View>
  );
}

/**
 * Skeleton loading bar for placeholder content
 */
export function SkeletonBar({
  width,
  height,
  style,
}: {
  width: number | string;
  height: number;
  style?: any;
}) {
  const pulse = useSharedValue(0.6);
  pulse.value = withTiming(1, { duration: 800 });

  const skeletonStyle = useAnimatedStyle(() => ({
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
        skeletonStyle,
        style,
      ]}
    />
  );
}

/**
 * Empty state component with icon and message
 */
export function EmptyState({
  icon,
  title,
  message,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  message?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message && <Text style={styles.emptyMessage}>{message}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
