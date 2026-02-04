/**
 * Hooks Index
 * Central export for all custom hooks
 */

// Data hooks
export { useAgentQuery, useUpdateAgentMutation } from "./useAgentQuery";
export {
  usePhoneNumbersQuery,
  useAgentPhoneNumber,
} from "./usePhoneNumberQuery";
export { useUserQuery } from "./useUserQuery";

// Feature hooks
export { useVoiceCall } from "./useVoiceCall";
export { default as useDeviceContacts } from "./useDeviceContacts";
export { default as usePhone } from "./usePhone";
export { default as useHome } from "./useHome";
export { default as useMessages } from "./useMessages";
export { default as useCalendar } from "./useCalendar";
export { default as useCallHistory } from "./useCallHistory";
export { default as useCallDetails } from "./useCallDetails";
export { default as useEditAgent } from "./useEditAgent";
export { default as useBuyPhoneNumber } from "./useBuyPhoneNumber";
export { default as useCallForwarding } from "./useCallForwarding";
export { default as useContactLookup } from "./useContactLookup";
export { default as useContactManagement } from "./useContactManagement";
export { default as useAnalytics } from "./useAnalytics";
export { default as useAudioPlayer } from "./useAudioPlayer";
