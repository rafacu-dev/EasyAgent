/**
 * useContactLookup Hook
 *
 * Provides efficient lookup of device contact names by phone number.
 * Creates a normalized map of phone numbers to contact names for quick lookups.
 * Used to enrich call history and other lists with contact names.
 */

import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAllContacts,
  checkContactsPermission,
  DeviceContact,
} from "@/app/utils/contactService";

export interface ContactLookupResult {
  /** Map of normalized phone numbers to contact names */
  contactsMap: Map<string, string>;
  /** Look up a contact name by phone number */
  getContactName: (phoneNumber: string | null | undefined) => string | null;
  /** Whether contacts are currently loading */
  isLoading: boolean;
  /** Whether the user has granted contacts permission */
  hasPermission: boolean | null;
}

/**
 * Normalize phone number for comparison
 * Removes all formatting characters and optionally keeps last 10 digits
 */
const normalizePhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters except leading +
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");
  // Remove the + if present
  const withoutPlus = cleaned.replace(/^\+/, "");
  // Return last 10 digits for better matching across different formats
  return withoutPlus.slice(-10);
};

/**
 * Hook that provides contact name lookup functionality
 */
export function useContactLookup(): ContactLookupResult {
  // Check permission and fetch contacts
  const { data: contactsData, isLoading } = useQuery({
    queryKey: ["device-contacts-lookup"],
    queryFn: async () => {
      const permission = await checkContactsPermission();
      if (!permission.granted) {
        return { contacts: [] as DeviceContact[], hasPermission: false };
      }
      const contacts = await getAllContacts({ pageSize: 1000 });
      return { contacts, hasPermission: true };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  const hasPermission = contactsData?.hasPermission ?? null;

  // Build a map of normalized phone numbers to contact names
  const contactsMap = useMemo(() => {
    const map = new Map<string, string>();
    const contacts = contactsData?.contacts ?? [];
    for (const contact of contacts) {
      if (
        !contact.name ||
        contact.name === "Unknown" ||
        contact.phoneNumbers.length === 0
      )
        continue;

      for (const phone of contact.phoneNumbers) {
        if (!phone.number) continue;
        const normalized = normalizePhoneNumber(phone.number);
        if (normalized.length >= 7) {
          // Only add if we have at least 7 digits
          map.set(normalized, contact.name);
        }
      }
    }

    return map;
  }, [contactsData?.contacts]);

  // Lookup function that finds contact name by phone number
  const getContactName = useCallback(
    (phoneNumber: string | null | undefined): string | null => {
      if (!phoneNumber) return null;

      const normalized = normalizePhoneNumber(phoneNumber);
      if (normalized.length < 7) return null;

      return contactsMap.get(normalized) ?? null;
    },
    [contactsMap],
  );

  return {
    contactsMap,
    getContactName,
    isLoading,
    hasPermission,
  };
}

export default useContactLookup;
