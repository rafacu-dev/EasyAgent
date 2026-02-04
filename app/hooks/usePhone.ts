/**
 * usePhone Hook
 *
 * Manages all phone-related state and logic:
 * - Phone number input
 * - Call mode (agent vs direct)
 * - Voice recording and transcription
 * - Making calls (agent and direct)
 */

import { useState, useCallback } from "react";
import { Alert, Vibration } from "react-native";
import { useTranslation } from "react-i18next";
import { useAgentQuery, useAgentPhoneNumber } from "@/app/hooks";
import { useVoiceCall } from "@/app/hooks/useVoiceCall";
import {
  showError,
  showSuccess,
  showInfo,
  showWarning,
} from "@/app/utils/toast";
import {
  formatPhoneNumber,
  normalizePhoneNumber,
} from "@/app/utils/formatters";
import { apiClient } from "@/app/utils/axios-interceptor";
import type { DeviceContact } from "@/app/utils/contactService";

export interface UsePhoneReturn {
  // Data
  agentConfig: any;
  phoneNumber: string | null;
  isLoadingAgent: boolean;
  isLoadingPhone: boolean;

  // Phone Input
  phoneNumberInput: string;
  setPhoneNumberInput: (value: string) => void;
  handleDigitPress: (digit: string) => void;
  handleBackspace: () => void;
  handleClear: () => void;

  // Call Mode
  isAgentMode: boolean;
  setIsAgentMode: (value: boolean) => void;
  callPrompt: string;
  setCallPrompt: (value: string) => void;

  // Call Actions
  isLoading: boolean;
  handleMakeCall: () => Promise<void>;

  // Voice SDK
  callState: any;
  formattedDuration: string;
  isSDKAvailable: boolean;
  hangUp: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  toggleSpeaker: () => void;
  sendDigits: (digits: string) => void;

  // Contact Picker
  showContactsModal: boolean;
  setShowContactsModal: (value: boolean) => void;
  handleSelectContact: (contact: DeviceContact, phone: string) => void;

  // Info Modal
  showInfoModal: boolean;
  setShowInfoModal: (value: boolean) => void;
}

export const usePhone = (): UsePhoneReturn => {
  const { t } = useTranslation();

  // Agent and phone number
  const { data: agentConfig, isLoading: isLoadingAgent } = useAgentQuery();
  const { phoneNumber, isLoading: isLoadingPhone } = useAgentPhoneNumber(
    agentConfig?.id,
  );

  // Phone input state
  const [phoneNumberInput, setPhoneNumberInput] = useState("");

  // Call mode state
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [callPrompt, setCallPrompt] = useState("");

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Voice SDK hook
  const {
    isSDKAvailable,
    callState,
    formattedDuration,
    makeCall,
    hangUp,
    toggleMute,
    toggleHold,
    toggleSpeaker,
    sendDigits,
  } = useVoiceCall({
    fromNumber: phoneNumber || null,
  });

  // Handle digit press
  const handleDigitPress = useCallback(
    (digit: string) => {
      if (callState.isConnected) {
        sendDigits(digit);
      } else {
        setPhoneNumberInput((prev) => prev + digit);
      }
    },
    [callState.isConnected, sendDigits],
  );

  // Handle backspace
  const handleBackspace = useCallback(() => {
    Vibration.vibrate(1);
    setPhoneNumberInput((prev) => prev.slice(0, -1));
  }, []);

  // Handle clear
  const handleClear = useCallback(() => {
    setPhoneNumberInput("");
  }, []);

  // Handle contact selection
  const handleSelectContact = useCallback(
    (contact: DeviceContact, phone: string) => {
      setPhoneNumberInput(normalizePhoneNumber(phone));
      setShowContactsModal(false);
    },
    [],
  );

  // Execute call
  const executeCall = async (formattedInput: string) => {
    setIsLoading(true);
    try {
      if (isAgentMode) {
        // AI Agent call
        await apiClient.post("calls/create-phone-call/", {
          agent_id: agentConfig?.id,
          from_number: phoneNumber,
          to_number: formattedInput,
          call_prompt: callPrompt,
        });
        showSuccess(
          t("phone.success", "Success"),
          t("phone.agentCallInitiated", "AI agent call initiated successfully"),
        );
        setPhoneNumberInput("");
        setCallPrompt("");
      } else {
        // Direct call via Voice SDK
        if (isSDKAvailable) {
          await makeCall(formattedInput);
        } else {
          showWarning(
            t("phone.sdkNotAvailable", "Voice Calling Unavailable"),
            t(
              "phone.sdkNotAvailableMessage",
              "Direct calling requires native modules. Please use AI Agent mode or rebuild the app with native support.",
            ),
          );
        }
      }
    } catch (error: any) {
      showError(
        t("phone.error", "Error"),
        error.response?.data?.error ||
          t("phone.callFailed", "Failed to initiate call"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle make call with confirmation
  const handleMakeCall = async () => {
    Vibration.vibrate(1);

    if (!phoneNumberInput || phoneNumberInput.length < 10) {
      showError(
        t("phone.error", "Error"),
        t("phone.invalidNumber", "Please enter a valid phone number"),
      );
      return;
    }

    if (isAgentMode && !callPrompt.trim()) {
      showError(
        t("phone.error", "Error"),
        t("phone.promptRequired", "Please enter instructions for the agent"),
      );
      return;
    }

    const formattedInput = formatPhoneNumber(phoneNumberInput);

    Alert.alert(
      t("phone.confirmCallTitle", "Confirm Call"),
      `${t("phone.confirmCallMessage", "Do you want to call")} ${formattedInput}?`,
      [
        {
          text: t("common.cancel", "Cancel"),
          style: "cancel",
        },
        {
          text: t("common.call", "Call"),
          onPress: () => executeCall(formattedInput),
        },
      ],
    );
  };

  return {
    // Data
    agentConfig,
    phoneNumber,
    isLoadingAgent,
    isLoadingPhone,

    // Phone Input
    phoneNumberInput,
    setPhoneNumberInput,
    handleDigitPress,
    handleBackspace,
    handleClear,

    // Call Mode
    isAgentMode,
    setIsAgentMode,
    callPrompt,
    setCallPrompt,

    // Call Actions
    isLoading,
    handleMakeCall,

    // Voice SDK
    callState,
    formattedDuration,
    isSDKAvailable,
    hangUp,
    toggleMute,
    toggleHold,
    toggleSpeaker,
    sendDigits,

    // Contact Picker
    showContactsModal,
    setShowContactsModal,
    handleSelectContact,

    // Info Modal
    showInfoModal,
    setShowInfoModal,
  };
};

export default usePhone;
