import Toast from "react-native-toast-message";

/**
 * Show an error toast notification
 */
export const showError = (title: string, message?: string) => {
  Toast.show({
    type: "error",
    text1: title,
    text2: message,
    position: "top",
    topOffset: 60,
    visibilityTime: 4000,
  });
};

/**
 * Show a success toast notification
 */
export const showSuccess = (title: string, message?: string) => {
  Toast.show({
    type: "success",
    text1: title,
    text2: message,
    position: "top",
    topOffset: 60,
    visibilityTime: 3000,
  });
};

/**
 * Show an info toast notification
 */
export const showInfo = (title: string, message?: string) => {
  Toast.show({
    type: "info",
    text1: title,
    text2: message,
    position: "top",
    topOffset: 60,
    visibilityTime: 3000,
  });
};

/**
 * Show a warning toast notification
 */
export const showWarning = (title: string, message?: string) => {
  Toast.show({
    type: "warning",
    text1: title,
    text2: message,
    position: "top",
    topOffset: 60,
    visibilityTime: 4000,
  });
};
