/**
 * ContactPicker Component
 *
 * Reusable modal component for selecting contacts from device.
 * Features:
 * - Search contacts by name or phone number
 * - Select contact to call or message
 * - Handle permissions gracefully
 * - Native contact form integration
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import { useDeviceContacts } from "@/app/hooks/useDeviceContacts";
import { DeviceContact } from "@/app/utils/contactService";
import { formatPhoneNumber } from "@/app/utils/formatters";

export interface ContactPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectContact: (contact: DeviceContact, phoneNumber: string) => void;
  /** Title for the picker modal */
  title?: string;
  /** Show add new contact button */
  showAddNew?: boolean;
  /** Initial data when adding new contact */
  newContactInitialData?: {
    firstName?: string;
    phoneNumber?: string;
  };
}

export const ContactPicker: React.FC<ContactPickerProps> = ({
  visible,
  onClose,
  onSelectContact,
  title,
  showAddNew = true,
  newContactInitialData,
}) => {
  const { t } = useTranslation();
  const {
    filteredContacts,
    isLoading,
    hasPermission,
    canAskPermission,
    permissionChecked,
    searchQuery,
    setSearchQuery,
    requestPermission,
    openSettings,
    addNewContact,
    getContactPrimaryPhone,
  } = useDeviceContacts({ enabled: visible });

  const [selectedPhoneIndex, setSelectedPhoneIndex] = useState<{
    contactId: string;
    index: number;
  } | null>(null);

  // Handle contact selection
  const handleSelectContact = useCallback(
    (contact: DeviceContact) => {
      // If contact has multiple phone numbers, show selection
      if (contact.phoneNumbers.length > 1) {
        setSelectedPhoneIndex({ contactId: contact.id, index: -1 });
        return;
      }

      // Single phone number - select directly
      const phone = getContactPrimaryPhone(contact);
      if (phone) {
        onSelectContact(contact, phone);
        onClose();
      }
    },
    [onSelectContact, onClose, getContactPrimaryPhone],
  );

  // Handle phone number selection for multi-phone contacts
  const handleSelectPhone = useCallback(
    (contact: DeviceContact, phoneNumber: string) => {
      onSelectContact(contact, phoneNumber);
      setSelectedPhoneIndex(null);
      onClose();
    },
    [onSelectContact, onClose],
  );

  // Handle add new contact
  const handleAddNewContact = useCallback(async () => {
    const newContact = await addNewContact(newContactInitialData);
    if (newContact) {
      const phone = getContactPrimaryPhone(newContact);
      if (phone) {
        onSelectContact(newContact, phone);
        onClose();
      }
    }
  }, [
    addNewContact,
    newContactInitialData,
    onSelectContact,
    onClose,
    getContactPrimaryPhone,
  ]);

  // Request permission handler
  const handleRequestPermission = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  // Render permission request view
  const renderPermissionRequest = () => (
    <View style={styles.permissionContainer}>
      <Ionicons name="people-outline" size={64} color={Colors.textLight} />
      <Text style={styles.permissionTitle}>
        {t("contacts.permissionTitle", "Access Your Contacts")}
      </Text>
      <Text style={styles.permissionText}>
        {t(
          "contacts.permissionText",
          "To select contacts, we need access to your device's contacts.",
        )}
      </Text>

      {canAskPermission ? (
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={handleRequestPermission}
        >
          <Text style={styles.permissionButtonText}>
            {t("contacts.grantPermission", "Grant Permission")}
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.permissionDeniedText}>
            {t(
              "contacts.permissionDenied",
              "Permission was denied. Please enable it in Settings.",
            )}
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={openSettings}
          >
            <Text style={styles.permissionButtonText}>
              {t("contacts.openSettings", "Open Settings")}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  // Render contact item
  const renderContactItem = ({ item }: { item: DeviceContact }) => {
    const isExpanded = selectedPhoneIndex?.contactId === item.id;
    const primaryPhone = getContactPrimaryPhone(item);

    return (
      <View>
        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => handleSelectContact(item)}
        >
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={50} color={Colors.primary} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{item.name}</Text>
            {primaryPhone && (
              <Text style={styles.contactPhone}>
                {formatPhoneNumber(primaryPhone)}
              </Text>
            )}
            {item.phoneNumbers.length > 1 && (
              <Text style={styles.multiplePhones}>
                {t("contacts.multiplePhones", "{{count}} phone numbers", {
                  count: item.phoneNumbers.length,
                })}
              </Text>
            )}
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-forward"}
            size={20}
            color={Colors.textLight}
          />
        </TouchableOpacity>

        {/* Phone number expansion */}
        {isExpanded && (
          <View style={styles.phoneList}>
            {item.phoneNumbers.map((phone, index) => (
              <TouchableOpacity
                key={phone.id || index}
                style={styles.phoneItem}
                onPress={() => handleSelectPhone(item, phone.number)}
              >
                <View style={styles.phoneInfo}>
                  <Text style={styles.phoneLabel}>
                    {phone.label || t("contacts.phone", "Phone")}
                  </Text>
                  <Text style={styles.phoneNumber}>
                    {formatPhoneNumber(phone.number)}
                  </Text>
                </View>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {title || t("contacts.selectContact", "Select Contact")}
          </Text>
          {showAddNew && hasPermission && (
            <TouchableOpacity
              onPress={handleAddNewContact}
              style={styles.addButton}
            >
              <Ionicons name="add" size={28} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        {hasPermission && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder={t(
                "contacts.searchPlaceholder",
                "Search contacts...",
              )}
              placeholderTextColor={Colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Content */}
        {!permissionChecked ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : !hasPermission ? (
          renderPermissionRequest()
        ) : isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>
              {t("contacts.loading", "Loading contacts...")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContactItem}
            contentContainerStyle={
              filteredContacts.length === 0 ? styles.emptyList : undefined
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="search-outline"
                  size={64}
                  color={Colors.textLight}
                />
                <Text style={styles.emptyTitle}>
                  {searchQuery
                    ? t("contacts.noResults", "No contacts found")
                    : t("contacts.noContacts", "No contacts")}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? t(
                        "contacts.tryDifferentSearch",
                        "Try a different search term",
                      )
                    : t(
                        "contacts.addContactsToDevice",
                        "Add contacts to your device to see them here",
                      )}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  multiplePhones: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
  },
  phoneList: {
    backgroundColor: Colors.backgroundLight,
    paddingLeft: 78,
  },
  phoneItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  phoneInfo: {
    flex: 1,
  },
  phoneLabel: {
    fontSize: 12,
    color: Colors.textLight,
    textTransform: "capitalize",
  },
  phoneNumber: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: Colors.background,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 24,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  permissionDeniedText: {
    fontSize: 14,
    color: Colors.error,
    textAlign: "center",
    marginTop: 16,
  },
});

export default ContactPicker;
