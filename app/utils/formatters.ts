/**
 * Shared formatting utilities for dates, durations, and other values
 */

/**
 * Remove all non-digit characters from a phone number string
 * @param phoneNumber The input phone number string
 * @returns Only digits as a string
 */
export const cleanPhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/\D+/g, "");
};

/**
 * Format duration from milliseconds to human-readable string
 * @param durationMs Duration in milliseconds
 * @returns Formatted string like "2:30" or "0:00"
 */
export const formatDuration = (durationMs?: number): string => {
  if (!durationMs) return "0:00";
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Format duration from seconds to human-readable string
 * @param durationSeconds Duration in seconds
 * @returns Formatted string like "2:30" or "0:00"
 */
export const formatDurationSeconds = (durationSeconds?: number): string => {
  if (!durationSeconds) return "0:00";
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Format timestamp to short date (e.g., "Jan 15")
 * @param timestampMs Timestamp in milliseconds
 * @param locale Locale string (default: current device locale)
 * @returns Formatted date string
 */
export const formatShortDate = (
  timestampMs?: number,
  locale?: string,
): string => {
  if (!timestampMs) return "";
  const date = new Date(timestampMs);
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
};

/**
 * Format timestamp to date with weekday (e.g., "Mon, Jan 15")
 * @param timestampMs Timestamp in milliseconds
 * @param locale Locale string (default: current device locale)
 * @returns Formatted date string
 */
export const formatDateWithWeekday = (
  timestampMs?: number,
  locale?: string,
): string => {
  if (!timestampMs) return "";
  const date = new Date(timestampMs);
  return date.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format timestamp to full date and time
 * @param timestampMs Timestamp in milliseconds
 * @param locale Locale string (default: current device locale)
 * @returns Formatted datetime string
 */
export const formatDateTime = (
  timestampMs?: number,
  locale?: string,
): string => {
  if (!timestampMs) return "";
  const date = new Date(timestampMs);
  return date.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format timestamp to time only (e.g., "2:30 PM")
 * @param timestampMs Timestamp in milliseconds
 * @param locale Locale string (default: current device locale)
 * @returns Formatted time string
 */
export const formatTime = (timestampMs?: number, locale?: string): string => {
  if (!timestampMs) return "";
  const date = new Date(timestampMs);
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format phone number to display format
 * @param phoneNumber Raw phone number string
 * @returns Formatted phone number or original if can't format
 */
export const formatPhoneNumber = (phoneNumber?: string): string => {
  if (!phoneNumber) return "";
  const parsed = phoneNumber.replace(/\D+/g, "");
  if (phoneNumber.startsWith("+")) {
    return `+${parsed}`;
  }
  // Format US numbers
  if (parsed.length === 10) {
    return `+1${parsed.slice(0, 3)}${parsed.slice(3, 6)}${parsed.slice(6)}`;
  }

  // Format with country code
  if (parsed.length === 11 && parsed.startsWith("1")) {
    return `+1${parsed.slice(1, 4)}${parsed.slice(4, 7)}${parsed.slice(7)}`;
  }

  // Return original if can't format
  return phoneNumber;
};

/**
 * Extract error message from various error types
 * @param error Error object from catch block
 * @param fallback Fallback message if no error message found
 * @returns Error message string
 */
export const extractErrorMessage = (
  error: unknown,
  fallback = "An error occurred",
): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    // Axios error response
    const axiosError = error as {
      response?: {
        data?: { error?: string; message?: string; detail?: string };
      };
      error?: string;
      message?: string;
    };

    return (
      axiosError.response?.data?.error ||
      axiosError.response?.data?.message ||
      axiosError.response?.data?.detail ||
      axiosError.error ||
      axiosError.message ||
      fallback
    );
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
};
