import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/utils/axios-interceptor";
import { showError, showSuccess } from "@/app/utils/toast";
import type { Contact } from "@/app/utils/types";

export const useContactManagement = (phoneNumber?: string) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState("");

  // Contact lookup query
  const { data: contactLookupData, refetch: refetchContact } = useQuery<{
    data: Contact | null;
    found: boolean;
  }>({
    queryKey: ["contact-lookup", phoneNumber],
    queryFn: async () => {
      const response = await apiClient.get(
        `contacts/lookup/?phone_number=${encodeURIComponent(phoneNumber!)}`,
      );
      return response.data;
    },
    enabled: !!phoneNumber,
  });

  const existingContact = contactLookupData?.found
    ? contactLookupData.data
    : null;

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (contactData: {
      name: string;
      phone_number: string;
      notes: string;
    }) => {
      const response = await apiClient.post("contacts/", contactData);
      return response.data;
    },
    onSuccess: () => {
      showSuccess(
        t("callDetails.contactAdded", "Contact Added"),
        t("callDetails.contactAddedMessage", "Contact has been saved"),
      );
      setShowAddContactModal(false);
      setContactName("");
      setContactNotes("");
      queryClient.invalidateQueries({ queryKey: ["contact-lookup"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      refetchContact();
    },
    onError: (error: any) => {
      showError(
        t("callDetails.error", "Error"),
        error.response?.data?.error ||
          t("callDetails.contactAddFailed", "Failed to add contact"),
      );
    },
  });

  const handleAddContact = () => {
    if (!contactName.trim()) {
      showError(
        t("callDetails.error", "Error"),
        t("callDetails.nameRequired", "Please enter a name"),
      );
      return;
    }

    addContactMutation.mutate({
      name: contactName.trim(),
      phone_number: selectedPhoneNumber,
      notes: contactNotes.trim(),
    });
  };

  const openAddContactModal = (phoneNumber: string) => {
    setSelectedPhoneNumber(phoneNumber);
    setContactName("");
    setContactNotes("");
    setShowAddContactModal(true);
  };

  return {
    // State
    showAddContactModal,
    contactName,
    contactNotes,
    selectedPhoneNumber,
    existingContact,

    // Setters
    setShowAddContactModal,
    setContactName,
    setContactNotes,

    // Actions
    handleAddContact,
    openAddContactModal,

    // Mutation
    addContactMutation,
  };
};
