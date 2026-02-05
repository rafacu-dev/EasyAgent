/**
 * Call Status Helpers
 *
 * Utilities for displaying call status icons and colors
 */

import { Colors } from "./colors";

export type CallStatus =
  | "completed"
  | "busy"
  | "failed"
  | "no-answer"
  | "canceled"
  | "ended"
  | "error";

export interface CallStatusConfig {
  icon: string;
  color: string;
  label: string;
}

/**
 * Get icon, color, and label for a call status
 */
export function getCallStatusConfig(status: string): CallStatusConfig {
  const normalizedStatus = status?.toLowerCase() || "ended";

  const statusConfigs: Record<string, CallStatusConfig> = {
    completed: {
      icon: "checkmark-circle",
      color: Colors.success,
      label: "Completed",
    },
    busy: {
      icon: "remove-circle",
      color: "#F59E0B", // Amber
      label: "Busy",
    },
    failed: {
      icon: "close-circle",
      color: Colors.error,
      label: "Failed",
    },
    "no-answer": {
      icon: "alert-circle",
      color: "#6B7280", // Gray
      label: "No Answer",
    },
    canceled: {
      icon: "ban",
      color: "#9CA3AF", // Light gray
      label: "Canceled",
    },
    ended: {
      icon: "checkmark-circle",
      color: Colors.success,
      label: "Ended",
    },
    error: {
      icon: "warning",
      color: Colors.error,
      label: "Error",
    },
  };

  return statusConfigs[normalizedStatus] || statusConfigs["ended"];
}
