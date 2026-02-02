import { useState, useCallback } from "react";
import { Linking } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTranslation } from "react-i18next";
import { useAgentQuery, usePhoneNumbersQuery } from "@/app/utils/hooks";
import { showError, showSuccess } from "@/app/utils/toast";

export interface UseCallForwardingReturn {
  twilioNumber: string;
  hasTwilioNumber: boolean;
  expandedCarrier: string | null;
  setExpandedCarrier: (carrier: string | null) => void;
  handleDial: (code: string, label: string) => Promise<void>;
  copyTwilioNumber: () => Promise<void>;
  formatCode: (code: string, twilioNumber: string) => string;
}

export function useCallForwarding(): UseCallForwardingReturn {
  const { t } = useTranslation();
  const { data: agentConfig } = useAgentQuery();
  const { data: phoneNumbers } = usePhoneNumbersQuery();

  const phoneNumberData = phoneNumbers?.find(
    (pn) => pn.agent === Number(agentConfig?.id),
  );
  const twilioNumber = phoneNumberData?.phone_number || "";

  const [expandedCarrier, setExpandedCarrier] = useState<string | null>(null);

  const handleDial = useCallback(
    async (code: string, label: string) => {
      try {
        const url = `tel:${code}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          showError(
            t("common.error", "Error"),
            t(
              "callForwarding.cannotDial",
              "Unable to open dialer on this device",
            ),
          );
        }
      } catch (error) {
        console.log("Dialing error:", error);
        showError(
          t("common.error", "Error"),
          t("callForwarding.dialError", "Failed to dial code"),
        );
      }
    },
    [t],
  );

  const copyTwilioNumber = useCallback(async () => {
    await Clipboard.setStringAsync(twilioNumber);
    showSuccess(
      t("common.success", "Success"),
      t("callForwarding.numberCopied", "Phone number copied to clipboard"),
    );
  }, [twilioNumber, t]);

  const formatCode = useCallback((code: string, number: string) => {
    const cleanNumber = number.replace(/\D/g, "");
    return code.replace("{number}", cleanNumber);
  }, []);

  return {
    twilioNumber,
    hasTwilioNumber: !!twilioNumber,
    expandedCarrier,
    setExpandedCarrier,
    handleDial,
    copyTwilioNumber,
    formatCode,
  };
}
