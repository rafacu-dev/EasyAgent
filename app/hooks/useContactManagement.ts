import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { showSuccess } from "@/app/utils/toast";
import { normalizePhoneNumber } from "@/app/utils/formatters";
import {
  DeviceContact,
  findContactByPhoneNumber,
  presentNewContactForm,
} from "@/app/utils/contactService";

export const useContactManagement = (phoneNumber?: string) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [existingContact, setExistingContact] = useState<DeviceContact | null>(
    null,
  );
  const [isLoadingContact, setIsLoadingContact] = useState(false);

  // Look up contact by phone number from device contacts
  useEffect(() => {
    const lookupContact = async () => {
      if (!phoneNumber) {
        setExistingContact(null);
        return;
      }

      setIsLoadingContact(true);
      try {
        const contact = await findContactByPhoneNumber(
          normalizePhoneNumber(phoneNumber),
        );
        setExistingContact(contact);
      } catch (error) {
        console.error("Error looking up contact:", error);
        setExistingContact(null);
      } finally {
        setIsLoadingContact(false);
      }
    };

    lookupContact();
  }, [phoneNumber]);

  // Open native contact form to add a new contact
  const handleAddContact = async (phone: string, initialName?: string) => {
    const newContact = await presentNewContactForm({
      firstName: initialName,
      phoneNumber: normalizePhoneNumber(phone),
    });

    if (newContact) {
      showSuccess(
        t("callDetails.contactAdded", "Contact Added"),
        t(
          "callDetails.contactAddedMessage",
          "Contact has been saved to your device",
        ),
      );

      // Refresh device contacts cache
      queryClient.invalidateQueries({ queryKey: ["device-contacts"] });

      // Update local state
      setExistingContact(newContact);
    }

    return newContact;
  };

  // Refetch contact info (e.g., after editing)
  const refetchContact = async () => {
    if (!phoneNumber) return;

    setIsLoadingContact(true);
    try {
      const contact = await findContactByPhoneNumber(
        normalizePhoneNumber(phoneNumber),
      );
      setExistingContact(contact);
    } catch (error) {
      console.error("Error refetching contact:", error);
    } finally {
      setIsLoadingContact(false);
    }
  };

  return {
    // State
    showAddContactModal,
    existingContact,
    isLoadingContact,

    // Setters
    setShowAddContactModal,

    // Actions
    handleAddContact,
    refetchContact,
  };
};
