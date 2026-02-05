/**
 * Contact Service - Handles all expo-contacts operations
 *
 * This service provides a clean interface for:
 * - Requesting contact permissions
 * - Fetching device contacts
 * - Searching contacts
 * - Getting contact by ID
 * - Formatting contact data for app use
 */

import * as Contacts from "expo-contacts";

// Types for device contacts
export interface DeviceContact {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phoneNumbers: ContactPhoneNumber[];
  emails: ContactEmail[];
  imageAvailable: boolean;
  image?: { uri: string };
}

export interface ContactPhoneNumber {
  id?: string;
  label?: string;
  number: string;
  isPrimary?: boolean;
}

export interface ContactEmail {
  id?: string;
  label?: string;
  email: string;
  isPrimary?: boolean;
}

export interface ContactPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

export interface ContactSearchOptions {
  query?: string;
  pageSize?: number;
  pageOffset?: number;
  sort?: Contacts.SortTypes;
}

/**
 * Request permission to access device contacts
 */
export const requestContactsPermission =
  async (): Promise<ContactPermissionResult> => {
    try {
      const { status, canAskAgain } = await Contacts.requestPermissionsAsync();
      return {
        granted: status === "granted",
        canAskAgain,
      };
    } catch (error) {
      console.error("Error requesting contacts permission:", error);
      return { granted: false, canAskAgain: false };
    }
  };

/**
 * Check current contacts permission status
 */
export const checkContactsPermission =
  async (): Promise<ContactPermissionResult> => {
    try {
      const { status, canAskAgain } = await Contacts.getPermissionsAsync();
      return {
        granted: status === "granted",
        canAskAgain,
      };
    } catch (error) {
      console.error("Error checking contacts permission:", error);
      return { granted: false, canAskAgain: false };
    }
  };

/**
 * Format raw expo-contacts contact to our app format
 */
const formatContact = (contact: Contacts.Contact): DeviceContact => {
  const phoneNumbers: ContactPhoneNumber[] = (contact.phoneNumbers || []).map(
    (phone) => ({
      id: phone.id,
      label: phone.label,
      number: phone.number || "",
      isPrimary: phone.isPrimary,
    }),
  );

  const emails: ContactEmail[] = (contact.emails || []).map((email) => ({
    id: email.id,
    label: email.label,
    email: email.email || "",
    isPrimary: email.isPrimary,
  }));

  // expo-contacts uses 'id' internally even if not in types
  const contactId =
    (contact as unknown as { id?: string }).id ||
    Math.random().toString(36).substring(7);

  return {
    id: contactId,
    name:
      contact.name ||
      `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
      "Unknown",
    firstName: contact.firstName || "",
    lastName: contact.lastName || "",
    phoneNumbers,
    emails,
    imageAvailable: contact.imageAvailable || false,
    image: contact.image?.uri ? { uri: contact.image.uri } : undefined,
  };
};

/**
 * Get all contacts from device
 */
export const getAllContacts = async (
  options: ContactSearchOptions = {},
): Promise<DeviceContact[]> => {
  try {
    const permission = await checkContactsPermission();
    if (!permission.granted) {
      console.warn("Contacts permission not granted");
      return [];
    }

    const { pageSize = 10000, pageOffset = 0, sort } = options;

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails,
        Contacts.Fields.Image,
        Contacts.Fields.ImageAvailable,
      ],
      pageSize,
      pageOffset,
      sort: sort || Contacts.SortTypes.FirstName,
    });

    // Filter out contacts without proper names (likely auto-added by WhatsApp, etc.)
    const validContacts = data.filter((contact) => {
      if (!contact.phoneNumbers) {
        return false;
      }
      const hasName = contact.name && contact.name.trim().length > 0;
      const hasFirstOrLast =
        (contact.firstName && contact.firstName.trim().length > 0) ||
        (contact.lastName && contact.lastName.trim().length > 0);
      return hasName || hasFirstOrLast;
    });

    return validContacts.map(formatContact);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return [];
  }
};

/**
 * Search contacts by name or phone number
 */
export const searchContacts = async (
  query: string,
  options: ContactSearchOptions = {},
): Promise<DeviceContact[]> => {
  try {
    if (!query.trim()) {
      return getAllContacts(options);
    }

    const permission = await checkContactsPermission();
    if (!permission.granted) {
      return [];
    }

    // Get all contacts and filter (expo-contacts doesn't have native search)
    const allContacts = await getAllContacts({ ...options, pageSize: 10000 });

    const lowerQuery = query.toLowerCase();

    return allContacts.filter((contact) => {
      // Match by name
      if (contact.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Match by phone number (remove formatting for comparison)
      const cleanQuery = query.replace(/[\s\-\(\)\+]/g, "");
      return contact.phoneNumbers.some((phone) => {
        const cleanNumber = phone.number.replace(/[\s\-\(\)\+]/g, "");
        return cleanNumber.includes(cleanQuery);
      });
    });
  } catch (error) {
    console.error("Error searching contacts:", error);
    return [];
  }
};

/**
 * Get a single contact by ID
 */
export const getContactById = async (
  contactId: string,
): Promise<DeviceContact | null> => {
  try {
    const permission = await checkContactsPermission();
    if (!permission.granted) {
      return null;
    }

    const contact = await Contacts.getContactByIdAsync(contactId, [
      Contacts.Fields.Name,
      Contacts.Fields.FirstName,
      Contacts.Fields.LastName,
      Contacts.Fields.PhoneNumbers,
      Contacts.Fields.Emails,
      Contacts.Fields.Image,
      Contacts.Fields.ImageAvailable,
    ]);

    if (!contact) {
      return null;
    }

    return formatContact(contact);
  } catch (error) {
    console.error("Error getting contact by ID:", error);
    return null;
  }
};

/**
 * Find contact by phone number
 */
export const findContactByPhoneNumber = async (
  phoneNumber: string,
): Promise<DeviceContact | null> => {
  try {
    const permission = await checkContactsPermission();
    if (!permission.granted) {
      return null;
    }

    // Normalize phone number for comparison
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)\+]/g, "");

    // Search through contacts
    const allContacts = await getAllContacts({ pageSize: 10000 });

    return (
      allContacts.find((contact) =>
        contact.phoneNumbers.some((phone) => {
          const contactCleanNumber = phone.number.replace(/[\s\-\(\)\+]/g, "");
          // Match last 10 digits (for different country code formats)
          const last10Query = cleanNumber.slice(-10);
          const last10Contact = contactCleanNumber.slice(-10);
          return (
            contactCleanNumber === cleanNumber ||
            (last10Query.length >= 7 && last10Query === last10Contact)
          );
        }),
      ) || null
    );
  } catch (error) {
    console.error("Error finding contact by phone:", error);
    return null;
  }
};

/**
 * Get primary phone number from a contact
 */
export const getPrimaryPhoneNumber = (
  contact: DeviceContact,
): string | null => {
  if (contact.phoneNumbers.length === 0) {
    return null;
  }

  // Try to find a primary number first
  const primary = contact.phoneNumbers.find((p) => p.isPrimary);
  if (primary) {
    return primary.number;
  }

  // Try to find a mobile number
  const mobile = contact.phoneNumbers.find(
    (p) =>
      p.label?.toLowerCase().includes("mobile") ||
      p.label?.toLowerCase().includes("cell"),
  );
  if (mobile) {
    return mobile.number;
  }

  // Return first available number
  return contact.phoneNumbers[0].number;
};

/**
 * Create a new contact on the device
 */
export const createDeviceContact = async (contact: {
  firstName: string;
  lastName?: string;
  phoneNumber: string;
  email?: string;
}): Promise<string | null> => {
  try {
    const permission = await checkContactsPermission();
    if (!permission.granted) {
      return null;
    }

    const newContact: Partial<Contacts.Contact> = {
      [Contacts.Fields.FirstName]: contact.firstName,
      [Contacts.Fields.LastName]: contact.lastName || "",
      [Contacts.Fields.PhoneNumbers]: [
        {
          label: "mobile",
          number: contact.phoneNumber,
        },
      ],
    };

    if (contact.email) {
      newContact[Contacts.Fields.Emails] = [
        {
          label: "personal",
          email: contact.email,
        },
      ];
    }

    const contactId = await Contacts.addContactAsync(
      newContact as Contacts.Contact,
    );
    return contactId;
  } catch (error) {
    console.error("Error creating contact:", error);
    return null;
  }
};

/**
 * Open the device contact form to add a new contact
 */
export const presentNewContactForm = async (initialData?: {
  firstName?: string;
  phoneNumber?: string;
}): Promise<DeviceContact | null> => {
  try {
    const permission = await requestContactsPermission();
    if (!permission.granted) {
      return null;
    }

    // Format and check for duplicates if phone number provided
    if (initialData?.phoneNumber) {
      const cleanNumber = initialData.phoneNumber.replace(/[\s\-\(\)\+]/g, "");
      const existingContact = await findContactByPhoneNumber(
        initialData.phoneNumber,
      );

      if (existingContact) {
        console.warn("Contact already exists with this phone number");
        return existingContact;
      }
    }

    const contact: Partial<Contacts.Contact> = {};

    if (initialData?.firstName) {
      contact[Contacts.Fields.FirstName] = initialData.firstName;
    }

    if (initialData?.phoneNumber) {
      // Format phone number before adding
      const formattedNumber = initialData.phoneNumber.replace(
        /[\s\-\(\)]/g,
        "",
      );
      contact[Contacts.Fields.PhoneNumbers] = [
        {
          label: "mobile",
          number: formattedNumber.startsWith("+")
            ? formattedNumber
            : `+${formattedNumber}`,
        },
      ];
    }

    const result = await Contacts.presentFormAsync(
      null,
      contact as Contacts.Contact,
      {
        isNew: true,
      },
    );

    if (result) {
      return formatContact(result);
    }

    return null;
  } catch (error) {
    console.error("Error presenting contact form:", error);
    return null;
  }
};

/**
 * Open existing contact for editing
 */
export const editContact = async (
  contactId: string,
): Promise<DeviceContact | null> => {
  try {
    const permission = await checkContactsPermission();
    if (!permission.granted) {
      return null;
    }

    const contact = await Contacts.getContactByIdAsync(contactId);
    if (!contact) {
      return null;
    }

    const result = await Contacts.presentFormAsync(contactId, contact, {
      isNew: false,
    });

    if (result) {
      return formatContact(result);
    }

    return null;
  } catch (error) {
    console.error("Error editing contact:", error);
    return null;
  }
};

/**
 * Get contacts count
 */
export const getContactsCount = async (): Promise<number> => {
  try {
    const permission = await checkContactsPermission();
    if (!permission.granted) {
      return 0;
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.ID],
      pageSize: 1,
    });

    // expo-contacts returns total count in the result
    return data.length > 0
      ? await Contacts.getContactsAsync({}).then((r) => r.data.length)
      : 0;
  } catch (error) {
    console.error("Error getting contacts count:", error);
    return 0;
  }
};
