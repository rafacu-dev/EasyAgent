/**
 * Contacts Screen
 *
 * Uses expo-contacts to display and interact with device contacts.
 * Features:
 * - Browse device contacts
 * - Search contacts by name or phone
 * - Call or message contacts
 * - Add new contacts via native form
 * - Edit existing contacts
 */

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { Colors } from "@/app/utils/colors";
import { useDeviceContacts } from "@/app/hooks/useDeviceContacts";
import { DeviceContact } from "@/app/utils/contactService";
import {
  formatPhoneNumber,
  normalizePhoneNumber,
} from "@/app/utils/formatters";

export default function ContactsScreen() {
  const { t } = useTranslation();

  const [refreshing, setRefreshing] = useState(false);
  const [expandedContactId, setExpandedContactId] = useState<string | null>(
    null,
  );
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [callModalNumber, setCallModalNumber] = useState<string>("");

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
    refetch,
    addNewContact,
    editExistingContact,
    getContactPrimaryPhone,
  } = useDeviceContacts();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Show call method modal instead of calling directly
  const handleCall = useCallback((phoneNumber: string) => {
    setCallModalNumber(phoneNumber);
    setCallModalVisible(true);
  }, []);

  const handleCallWithTwilio = useCallback(() => {
    setCallModalVisible(false);
    router.push({
      pathname: "/(tabs)/phone",
      params: { phoneNumber: callModalNumber },
    });
  }, [callModalNumber]);

  const handleCallWithPhone = useCallback(() => {
    setCallModalVisible(false);
    Linking.openURL(`tel:${callModalNumber}`);
  }, [callModalNumber]);

  // Show action options for a contact
  const showContactOptions = useCallback(
    (contact: DeviceContact, phoneNumber: string) => {
      Alert.alert(contact.name, formatPhoneNumber(phoneNumber), [
        {
          text: t("contacts.call", "Call"),
          onPress: () => {
            handleCall(phoneNumber);
          },
        },
        {
          text: t("contacts.message", "Message"),
          onPress: () => {
            router.push({
              pathname: "/(tabs)/messages",
              params: { other_party: normalizePhoneNumber(phoneNumber) },
            });
          },
        },
        {
          text: t("contacts.edit", "Edit"),
          onPress: async () => {
            await editExistingContact(contact.id);
          },
        },
        {
          text: t("common.cancel", "Cancel"),
          style: "cancel",
        },
      ]);
    },
    [t, editExistingContact],
  );

  // Handle contact press - expand if multiple phones, otherwise show options
  const handleContactPress = useCallback(
    (contact: DeviceContact) => {
      if (contact.phoneNumbers.length > 1) {
        setExpandedContactId(
          expandedContactId === contact.id ? null : contact.id,
        );
      } else {
        const phone = getContactPrimaryPhone(contact);
        if (phone) {
          showContactOptions(contact, phone);
        }
      }
    },
    [expandedContactId, getContactPrimaryPhone, showContactOptions],
  );

  // Handle phone number selection for multi-phone contacts
  const handlePhoneSelect = useCallback(
    (contact: DeviceContact, phoneNumber: string) => {
      showContactOptions(contact, phoneNumber);
      setExpandedContactId(null);
    },
    [showContactOptions],
  );

  // Handle add new contact
  const handleAddContact = useCallback(async () => {
    await addNewContact();
  }, [addNewContact]);

  // Render permission request view
  const renderPermissionRequest = () => (
    <View style={styles.permissionContainer}>
      <Ionicons name="people-outline" size={80} color={Colors.textLight} />
      <Text style={styles.permissionTitle}>
        {t("contacts.permissionTitle", "Access Your Contacts")}
      </Text>
      <Text style={styles.permissionText}>
        {t(
          "contacts.permissionDescription",
          "Grant access to view your device contacts. Your contacts stay on your device and are not uploaded to our servers.",
        )}
      </Text>

      {canAskPermission ? (
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Ionicons name="lock-open-outline" size={20} color="#FFFFFF" />
          <Text style={styles.permissionButtonText}>
            {t("contacts.grantPermission", "Grant Permission")}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.permissionDeniedContainer}>
          <Text style={styles.permissionDeniedText}>
            {t(
              "contacts.permissionDenied",
              "Permission was denied. Please enable contacts access in your device settings.",
            )}
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={openSettings}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.settingsButtonText}>
              {t("contacts.openSettings", "Open Settings")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render contact item
  const renderContactItem = ({ item }: { item: DeviceContact }) => {
    const isExpanded = expandedContactId === item.id;
    const primaryPhone = getContactPrimaryPhone(item);

    // Filter out duplicate phone numbers (normalize and deduplicate)
    const uniquePhones = item.phoneNumbers.filter((phone, index, self) => {
      const normalized = normalizePhoneNumber(phone.number);
      return (
        index ===
        self.findIndex((p) => normalizePhoneNumber(p.number) === normalized)
      );
    });

    const hasMultiplePhones = uniquePhones.length > 1;

    return (
      <View>
        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => handleContactPress(item)}
          onLongPress={() => editExistingContact(item.id)}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{item.name}</Text>
            {primaryPhone && (
              <Text style={styles.contactPhone}>
                {formatPhoneNumber(primaryPhone)}
              </Text>
            )}
            {hasMultiplePhones && (
              <Text style={styles.multiplePhones}>
                {t("contacts.phonesCount", "{{count}} phone numbers", {
                  count: uniquePhones.length,
                })}
              </Text>
            )}
          </View>
          <View style={styles.contactActions}>
            {primaryPhone && !hasMultiplePhones && (
              <>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleCall(primaryPhone)}
                >
                  <Ionicons
                    name="call-outline"
                    size={22}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/messages",
                      params: {
                        other_party: normalizePhoneNumber(primaryPhone),
                      },
                    })
                  }
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={22}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </>
            )}
            {hasMultiplePhones && (
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={22}
                color={Colors.textLight}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Expanded phone list for multi-phone contacts */}
        {isExpanded && hasMultiplePhones && (
          <View style={styles.phoneListContainer}>
            {uniquePhones.map((phone, index) => (
              <View key={phone.id || index} style={styles.phoneListItem}>
                <View style={styles.phoneListInfo}>
                  <Text style={styles.phoneListLabel}>
                    {phone.label || t("contacts.phone", "Phone")}
                  </Text>
                  <Text style={styles.phoneListNumber}>
                    {formatPhoneNumber(phone.number)}
                  </Text>
                </View>
                <View style={styles.phoneListActions}>
                  <TouchableOpacity
                    style={styles.phoneListButton}
                    onPress={() => handleCall(phone.number)}
                  >
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.phoneListButton}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/messages",
                        params: {
                          other_party: normalizePhoneNumber(phone.number),
                        },
                      })
                    }
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={18}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={Colors.textLight} />
      <Text style={styles.emptyTitle}>
        {searchQuery
          ? t("contacts.noResults", "No contacts found")
          : t("contacts.noContacts", "No contacts yet")}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? t("contacts.tryDifferentSearch", "Try a different search term")
          : t(
              "contacts.addContactsToDevice",
              "Add contacts to your device to see them here",
            )}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.emptyButton} onPress={handleAddContact}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.emptyButtonText}>
            {t("contacts.addContact", "Add Contact")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("contacts.title", "Contacts")}
        </Text>
        {hasPermission && (
          <TouchableOpacity onPress={handleAddContact} style={styles.addButton}>
            <Ionicons name="add" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search - only show if we have permission */}
      {hasPermission && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("contacts.search", "Search contacts...")}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={
            filteredContacts.length === 0 ? styles.emptyList : undefined
          }
          ListEmptyComponent={renderEmptyState()}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
        />
      )}

      {/* Call Method Modal */}
      <Modal
        visible={callModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCallModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCallModalVisible(false)}
        >
          <View style={styles.callModalContainer}>
            <View style={styles.callModalContent}>
              <Text style={styles.callModalTitle}>
                {t("contacts.callWith", "Call with")}
              </Text>
              <Text style={styles.callModalNumber}>
                {formatPhoneNumber(callModalNumber)}
              </Text>

              <TouchableOpacity
                style={styles.callModalOption}
                onPress={handleCallWithTwilio}
              >
                <View
                  style={[
                    styles.callModalIconContainer,
                    { backgroundColor: Colors.primary + "15" },
                  ]}
                >
                  <Ionicons name="headset" size={24} color={Colors.primary} />
                </View>
                <View style={styles.callModalOptionText}>
                  <Text style={styles.callModalOptionTitle}>
                    {t("contacts.callTwilio", "AI Agent Number")}
                  </Text>
                  <Text style={styles.callModalOptionDesc}>
                    {t(
                      "contacts.callTwilioDesc",
                      "Call using your Twilio number",
                    )}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.textLight}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.callModalOption}
                onPress={handleCallWithPhone}
              >
                <View
                  style={[
                    styles.callModalIconContainer,
                    { backgroundColor: Colors.success + "15" },
                  ]}
                >
                  <Ionicons name="call" size={24} color={Colors.success} />
                </View>
                <View style={styles.callModalOptionText}>
                  <Text style={styles.callModalOptionTitle}>
                    {t("contacts.callPhone", "Phone Number")}
                  </Text>
                  <Text style={styles.callModalOptionDesc}>
                    {t(
                      "contacts.callPhoneDesc",
                      "Call using your phone directly",
                    )}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.textLight}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.callModalCancel}
                onPress={() => setCallModalVisible(false)}
              >
                <Text style={styles.callModalCancelText}>
                  {t("common.cancel", "Cancel")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: Colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  addButton: {
    padding: 8,
    marginRight: -8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
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
  emptyList: {
    flex: 1,
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  multiplePhones: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
  },
  contactActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  phoneListContainer: {
    backgroundColor: Colors.backgroundLight,
    paddingLeft: 78,
  },
  phoneListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  phoneListInfo: {
    flex: 1,
  },
  phoneListLabel: {
    fontSize: 12,
    color: Colors.textLight,
    textTransform: "capitalize",
  },
  phoneListNumber: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  phoneListActions: {
    flexDirection: "row",
    gap: 16,
  },
  phoneListButton: {
    padding: 4,
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
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
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
    paddingHorizontal: 16,
  },
  permissionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  permissionDeniedContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  permissionDeniedText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  settingsButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  callModalContainer: {
    width: "85%",
    maxWidth: 360,
  },
  callModalContent: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  callModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 4,
  },
  callModalNumber: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  callModalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
    marginBottom: 10,
  },
  callModalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  callModalOptionText: {
    flex: 1,
  },
  callModalOptionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  callModalOptionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  callModalCancel: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  callModalCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
});
