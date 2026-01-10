// Color Theme - Business Professional with Orange Accent
export const Colors = {
  // Primary Colors
  primary: "#FF8C00", // Main orange
  primaryLight: "#FFA500", // Lighter orange
  primaryDark: "#E67E00", // Darker orange

  // Secondary Colors (Blue replacement)
  secondary: "#2E86C1", // Strong professional blue
  secondaryLight: "#D6EAF8", // Very light blue for backgrounds

  // Background Colors
  background: "#FFF5EE", // Soft peach/cream
  backgroundLight: "#FFFAF5", // Very light peach
  cardBackground: "#FFFFFF", // White for cards

  // Text Colors
  textPrimary: "#2C3E50", // Dark blue-gray
  textSecondary: "#7F8C8D", // Medium gray
  textLight: "#95A5A6", // Light gray
  textWhite: "#FFFFFF", // White text

  // Accent Colors
  success: "#4CAF50", // Green
  info: "#2E86C1", // Updated to match secondary
  warning: "#FFA726", // Orange warning
  error: "#FF6B6B", // Red
  purple: "#9B59B6", // Purple for analytics

  // Border & Divider Colors
  border: "#FFE4CC", // Light orange
  borderLight: "#F5F5F5", // Very light gray
  divider: "#EEEEEE", // Light divider

  // Shadow Colors
  shadow: "#000000", // Black for shadows
  shadowOrange: "#FF8C00", // Orange shadow

  // Status Colors
  statusActive: "#4CAF50", // Green for active
  statusInactive: "#95A5A6", // Gray for inactive
  statusMissed: "#FF6B6B", // Red for missed

  // Overlay Colors
  overlay: "rgba(0, 0, 0, 0.5)", // Semi-transparent black
  overlayLight: "rgba(0, 0, 0, 0.3)", // Light overlay
};

// Export individual color sets for convenience
export const TextColors = {
  primary: Colors.textPrimary,
  secondary: Colors.textSecondary,
  light: Colors.textLight,
  white: Colors.textWhite,
};

export const BackgroundColors = {
  main: Colors.background,
  light: Colors.backgroundLight,
  card: Colors.cardBackground,
};

export const AccentColors = {
  success: Colors.success,
  info: Colors.info,
  warning: Colors.warning,
  error: Colors.error,
};
