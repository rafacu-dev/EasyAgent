import { Alert, AlertButton, AlertOptions } from "react-native";

/**
 * Styled Alert Utility
 * Provides a consistent alert interface across the app with proper styling
 */

interface StyledAlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface StyledAlertOptions {
  title: string;
  message: string;
  buttons?: StyledAlertButton[];
  cancelable?: boolean;
}

/**
 * Show a styled confirmation alert with customizable buttons
 */
export const showConfirmAlert = ({
  title,
  message,
  buttons = [{ text: "OK", style: "default" }],
  cancelable = true,
}: StyledAlertOptions): void => {
  const alertButtons: AlertButton[] = buttons.map((btn) => ({
    text: btn.text,
    onPress: btn.onPress,
    style: btn.style,
  }));

  const options: AlertOptions = {
    cancelable,
  };

  Alert.alert(title, message, alertButtons, options);
};

/**
 * Show a destructive action confirmation alert (delete, logout, etc.)
 */
export const showDestructiveAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = "Confirm",
  cancelText: string = "Cancel",
): void => {
  Alert.alert(
    title,
    message,
    [
      {
        text: cancelText,
        style: "cancel",
      },
      {
        text: confirmText,
        style: "destructive",
        onPress: onConfirm,
      },
    ],
    { cancelable: true },
  );
};

/**
 * Show a simple confirmation alert with OK/Cancel
 */
export const showSimpleConfirmAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = "OK",
  cancelText: string = "Cancel",
): void => {
  Alert.alert(
    title,
    message,
    [
      {
        text: cancelText,
        style: "cancel",
      },
      {
        text: confirmText,
        style: "default",
        onPress: onConfirm,
      },
    ],
    { cancelable: true },
  );
};

/**
 * Show an info alert (single OK button)
 */
export const showInfoAlert = (
  title: string,
  message: string,
  onDismiss?: () => void,
): void => {
  Alert.alert(
    title,
    message,
    [
      {
        text: "OK",
        style: "default",
        onPress: onDismiss,
      },
    ],
    { cancelable: true },
  );
};
