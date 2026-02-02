import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/utils/axios-interceptor";
import { useAgentQuery, useUserQuery } from "@/app/utils/hooks";
import { showError, showSuccess, showWarning } from "@/app/utils/toast";

export interface AvailableNumber {
  phone_number: string;
  friendly_name: string;
  locality?: string;
  region?: string;
  capabilities?: {
    voice?: boolean;
    SMS?: boolean;
    MMS?: boolean;
  };
}

export interface UseBuyPhoneNumberReturn {
  // Search
  areaCode: string;
  setAreaCode: (value: string) => void;
  contains: string;
  setContains: (value: string) => void;
  handleSearch: () => void;

  // Modal
  showInfoModal: boolean;
  setShowInfoModal: (show: boolean) => void;

  // Data
  availableNumbers: AvailableNumber[];
  isLoading: boolean;
  error: Error | null;

  // Purchase
  handlePurchase: (phoneNumber: string) => void;
  isPurchasing: boolean;

  // Access
  isProOrAbove: boolean;
}

export function useBuyPhoneNumber(): UseBuyPhoneNumberReturn {
  const { t } = useTranslation();
  const { data: agentConfig } = useAgentQuery();
  const { isProOrAbove } = useUserQuery();
  const queryClient = useQueryClient();

  const [areaCode, setAreaCode] = useState("");
  const [contains, setContains] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Redirect to paywall if user is not pro
  useEffect(() => {
    if (!isProOrAbove) {
      showWarning(
        t("subscription.proFeature", "Pro Feature"),
        t(
          "subscription.phoneNumberProMessage",
          "Phone numbers are a Pro feature. Upgrade to access this feature.",
        ),
      );
      setTimeout(() => {
        router.replace("/paywall/PaywallScreen");
      }, 2000);
    }
  }, [isProOrAbove, t]);

  const {
    data: numbersResp,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["available-numbers", areaCode, contains],
    queryFn: async () => {
      const payload: Record<string, unknown> = {
        country_code: "US",
        limit: 20,
      };
      if (areaCode) payload.area_code = areaCode;
      if (contains) payload.contains = contains;

      return apiClient.post("phone-numbers/search-available/", payload);
    },
    enabled: isProOrAbove,
    staleTime: 2 * 60 * 1000,
  });

  const availableNumbers: AvailableNumber[] =
    numbersResp?.available_numbers ?? [];

  const purchaseMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      return apiClient.post("phone-numbers/purchase/", {
        phone_number: phoneNumber,
        agent_id: agentConfig?.id,
        friendly_name: `${agentConfig?.companyName || "Agent"} Number`,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["phoneNumbers"] }),
        queryClient.invalidateQueries({ queryKey: ["agent"] }),
        queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
      ]);

      showSuccess(
        t("getPhone.success", "Success!"),
        t(
          "getPhone.obtainSuccess",
          "Phone number obtained and linked to your agent successfully!",
        ),
      );
      setTimeout(() => {
        router.replace("/call-forwarding");
      }, 1500);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        error?.error ||
        t("getPhone.obtainError", "Failed to obtain phone number");
      showError(t("getPhone.error", "Error"), errorMessage);
    },
  });

  const handlePurchase = useCallback(
    (phoneNumber: string) => {
      Alert.alert(
        t("getPhone.confirmTitle", "Confirm Selection"),
        t(
          "getPhone.confirmMessage",
          `Are you sure you want to obtain ${phoneNumber} for your agent?`,
        ),
        [
          {
            text: t("common.cancel", "Cancel"),
            style: "cancel",
          },
          {
            text: t("common.confirm", "Confirm"),
            onPress: () => purchaseMutation.mutate(phoneNumber),
          },
        ],
      );
    },
    [purchaseMutation, t],
  );

  const handleSearch = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    areaCode,
    setAreaCode,
    contains,
    setContains,
    handleSearch,
    showInfoModal,
    setShowInfoModal,
    availableNumbers,
    isLoading,
    error: error as Error | null,
    handlePurchase,
    isPurchasing: purchaseMutation.isPending,
    isProOrAbove,
  };
}
