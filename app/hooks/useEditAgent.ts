import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/app/utils/axios-interceptor";
import { showError, showSuccess } from "@/app/utils/toast";
import { useAgentQuery, useUpdateAgentMutation } from "@/app/hooks";
import type { AgentConfig } from "@/app/utils/types";

export interface AgentFormData {
  agentName: string;
  agentGender: "male" | "female";
  agentDescription: string;
  sector: string;
  companyName: string;
  socialMediaAndWeb: string;
  companyServices: string;
  companyDescription: string;
  language: string;
  agentId: string | undefined;
}

export interface UseEditAgentReturn {
  formData: AgentFormData;
  setFormData: React.Dispatch<React.SetStateAction<AgentFormData>>;
  isLoading: boolean;
  isLoadingData: boolean;
  isDisabled: boolean;
  handleUpdate: () => Promise<void>;
  setGender: (gender: "male" | "female") => void;
  updateField: (field: keyof AgentFormData, value: string) => void;
}

export function useEditAgent(): UseEditAgentReturn {
  const { t } = useTranslation();
  const { data: agentConfig, isLoading: isLoadingData } = useAgentQuery();
  const updateAgentMutation = useUpdateAgentMutation();

  const [formData, setFormData] = useState<AgentFormData>({
    agentName: agentConfig?.agentName || "",
    agentGender: (agentConfig?.agentGender || "male") as "male" | "female",
    agentDescription: agentConfig?.agentDescription || "",
    sector: agentConfig?.sector || "",
    companyName: agentConfig?.companyName || "",
    socialMediaAndWeb: agentConfig?.socialMediaAndWeb || "",
    companyServices: agentConfig?.companyServices || "",
    companyDescription: agentConfig?.companyDescription || "",
    language: agentConfig?.language || "auto",
    agentId: agentConfig?.id,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (agentConfig) {
      setFormData({
        agentName: agentConfig.agentName || "",
        agentGender: agentConfig.agentGender || "male",
        agentDescription: agentConfig.agentDescription || "",
        sector: agentConfig.sector || "",
        companyName: agentConfig.companyName || "",
        socialMediaAndWeb: agentConfig.socialMediaAndWeb || "",
        companyServices: agentConfig.companyServices || "",
        companyDescription: agentConfig.companyDescription || "",
        language: agentConfig.language || "auto",
        agentId: agentConfig.id,
      });
    }
  }, [agentConfig]);

  const handleUpdate = useCallback(async () => {
    if (isLoading) return;

    if (!formData.agentId) {
      showError(
        t("common.error", "Error"),
        t("editAgent.noAgentId", "Agent ID not found. Cannot update."),
      );
      return;
    }

    setIsLoading(true);
    try {
      // Update user profile (company info)
      await apiClient.patch("profile/", {
        company_name: formData.companyName,
        sector: formData.sector,
      });

      // Update agent via mutation
      const updatedConfig: AgentConfig = {
        id: formData.agentId,
        sector: formData.sector,
        companyName: formData.companyName,
        socialMediaAndWeb: formData.socialMediaAndWeb,
        agentGender: formData.agentGender,
        agentName: formData.agentName,
        agentDescription: formData.agentDescription,
        companyServices: formData.companyServices,
        companyDescription: formData.companyDescription,
        language: formData.language,
      };

      await updateAgentMutation.mutateAsync(updatedConfig);

      showSuccess(
        t("common.success", "Success"),
        t("editAgent.updateSuccess", "Agent updated successfully"),
      );
      router.back();
    } catch (error: any) {
      console.error("Error updating agent:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        t("editAgent.updateError", "Failed to update agent");
      showError(t("common.error", "Error"), errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [formData, isLoading, t, updateAgentMutation]);

  const setGender = useCallback((gender: "male" | "female") => {
    setFormData((prev) => ({ ...prev, agentGender: gender }));
  }, []);

  const updateField = useCallback(
    (field: keyof AgentFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const isDisabled =
    formData.agentName.trim() === "" ||
    isLoading ||
    isLoadingData ||
    formData.companyName.trim() === "";

  return {
    formData,
    setFormData,
    isLoading,
    isLoadingData,
    isDisabled,
    handleUpdate,
    setGender,
    updateField,
  };
}
