/**
 * useDeviceContacts Hook
 *
 * React hook for managing device contacts with expo-contacts.
 * Provides easy access to contacts with caching, searching, and permission handling.
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Linking, Platform } from "react-native";
import {
  DeviceContact,
  getAllContacts,
  checkContactsPermission,
  requestContactsPermission,
  findContactByPhoneNumber,
  getPrimaryPhoneNumber,
  presentNewContactForm,
  editContact,
  ContactPermissionResult,
} from "@/app/utils/contactService";
import { normalizePhoneNumber } from "../utils/formatters";

export interface UseDeviceContactsOptions {
  /** Enable auto-fetch on mount */
  enabled?: boolean;
  /** Initial search query */
  initialQuery?: string;
  /** Page size for pagination */
  pageSize?: number;
}

export interface UseDeviceContactsReturn {
  // Data
  contacts: DeviceContact[];
  filteredContacts: DeviceContact[];

  // Loading states
  isLoading: boolean;
  isRefetching: boolean;

  // Permission
  hasPermission: boolean | null;
  canAskPermission: boolean;
  permissionChecked: boolean;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Actions
  requestPermission: () => Promise<boolean>;
  openSettings: () => void;
  refetch: () => Promise<void>;
  findByPhone: (phoneNumber: string) => Promise<DeviceContact | null>;
  addNewContact: (initialData?: {
    firstName?: string;
    phoneNumber?: string;
  }) => Promise<DeviceContact | null>;
  editExistingContact: (contactId: string) => Promise<DeviceContact | null>;

  // Utilities
  getContactPrimaryPhone: (contact: DeviceContact) => string | null;
}

export const useDeviceContacts = (
  options: UseDeviceContactsOptions = {},
): UseDeviceContactsReturn => {
  const { enabled = true, initialQuery = "", pageSize = 10000 } = options;

  const queryClient = useQueryClient();

  // Permission state
  const [permissionState, setPermissionState] =
    useState<ContactPermissionResult | null>(null);
  const [permissionChecked, setPermissionChecked] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const result = await checkContactsPermission();
      setPermissionState(result);
      setPermissionChecked(true);
    };

    if (enabled) {
      checkPermission();
    }
  }, [enabled]);

  // Fetch contacts query
  const {
    data: contacts = [],
    isLoading,
    isFetching: isRefetching,
    refetch: refetchQuery,
  } = useQuery<DeviceContact[]>({
    queryKey: ["device-contacts"],
    queryFn: async () => {
      if (!permissionState?.granted) {
        return [];
      }
      return getAllContacts({ pageSize });
    },
    enabled: enabled && permissionChecked && permissionState?.granted === true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  // Filter contacts based on search query
  const filteredContacts = useCallback(() => {
    if (!debouncedQuery.trim()) {
      return contacts.map((c) => {
        c.phoneNumbers = c.phoneNumbers.filter(
          (p, i, arr) =>
            normalizePhoneNumber(p.number) !==
            normalizePhoneNumber(arr[i + 1]?.number),
        );
        return c;
      });
    }

    const lowerQuery = debouncedQuery.toLowerCase();
    const cleanQuery = debouncedQuery.replace(/[\s\-\(\)\+]/g, "");

    return contacts.filter((contact) => {
      // Match by name
      if (contact.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Match by phone number
      return contact.phoneNumbers.some((phone) => {
        const cleanNumber = phone.number.replace(/[\s\-\(\)\+]/g, "");
        return cleanNumber.includes(cleanQuery);
      });
    });
  }, [contacts, debouncedQuery]);

  // Request permission handler
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const result = await requestContactsPermission();
    setPermissionState(result);

    if (result.granted) {
      // Invalidate and refetch contacts
      queryClient.invalidateQueries({ queryKey: ["device-contacts"] });
    }

    return result.granted;
  }, [queryClient]);

  // Open device settings
  const openSettings = useCallback(() => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  }, []);

  // Refetch contacts
  const refetch = useCallback(async () => {
    await refetchQuery();
  }, [refetchQuery]);

  // Find contact by phone
  const findByPhone = useCallback(
    async (phoneNumber: string): Promise<DeviceContact | null> => {
      // First check cached contacts
      const cleanQuery = phoneNumber.replace(/[\s\-\(\)\+]/g, "");
      const cachedContact = contacts.find((contact) =>
        contact.phoneNumbers.some((phone) => {
          const cleanNumber = phone.number.replace(/[\s\-\(\)\+]/g, "");
          const last10Query = cleanQuery.slice(-10);
          const last10Contact = cleanNumber.slice(-10);
          return (
            cleanNumber === cleanQuery ||
            (last10Query.length >= 7 && last10Query === last10Contact)
          );
        }),
      );

      if (cachedContact) {
        return cachedContact;
      }

      // Fall back to direct lookup
      return findContactByPhoneNumber(phoneNumber);
    },
    [contacts],
  );

  // Add new contact via device form
  const addNewContact = useCallback(
    async (initialData?: {
      firstName?: string;
      phoneNumber?: string;
    }): Promise<DeviceContact | null> => {
      const result = await presentNewContactForm(initialData);

      if (result) {
        // Refresh contacts list
        queryClient.invalidateQueries({ queryKey: ["device-contacts"] });
      }

      return result;
    },
    [queryClient],
  );

  // Edit existing contact
  const editExistingContact = useCallback(
    async (contactId: string): Promise<DeviceContact | null> => {
      const result = await editContact(contactId);

      if (result) {
        // Refresh contacts list
        queryClient.invalidateQueries({ queryKey: ["device-contacts"] });
      }

      return result;
    },
    [queryClient],
  );

  return {
    // Data
    contacts,
    filteredContacts: filteredContacts(),

    // Loading states
    isLoading,
    isRefetching,

    // Permission
    hasPermission: permissionState?.granted ?? null,
    canAskPermission: permissionState?.canAskAgain ?? true,
    permissionChecked,

    // Search
    searchQuery,
    setSearchQuery,

    // Actions
    requestPermission,
    openSettings,
    refetch,
    findByPhone,
    addNewContact,
    editExistingContact,

    // Utilities
    getContactPrimaryPhone: getPrimaryPhoneNumber,
  };
};

export default useDeviceContacts;
