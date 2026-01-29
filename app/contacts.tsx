import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { Colors } from "@/app/utils/colors";
import { apiClient } from "@/app/utils/axios-interceptor";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Contact } from "@/app/utils/types";
import {
  formatPhoneNumber,
  normalizePhoneNumber,
} from "@/app/utils/formatters";
import { showError, showSuccess } from "@/app/utils/toast";

export default function ContactsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Form state
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactNotes, setContactNotes] = useState("");

  // Fetch contacts
  const {
    data: contactsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["contacts", searchQuery],
    queryFn: async () => {
      const params = searchQuery
        ? `?search=${encodeURIComponent(searchQuery)}`
        : "";
      const response = await apiClient.get(`contacts/${params}`);
      return response.data;
    },
  });

  const contacts: Contact[] = contactsData?.data || [];

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      phone_number: string;
      notes: string;
    }) => {
      const response = await apiClient.post("contacts/", data);
      return response.data;
    },
    onSuccess: () => {
      showSuccess(
        t("contacts.added", "Contact Added"),
        t("contacts.addedMessage", "Contact has been saved"),
      );
      setShowAddModal(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error: any) => {
      showError(
        t("contacts.error", "Error"),
        error.response?.data?.error ||
          t("contacts.addFailed", "Failed to add contact"),
      );
    },
  });

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; phone_number?: string; notes?: string };
    }) => {
      const response = await apiClient.put(`contacts/${id}/`, data);
      return response.data;
    },
    onSuccess: () => {
      showSuccess(
        t("contacts.updated", "Contact Updated"),
        t("contacts.updatedMessage", "Contact has been updated"),
      );
      setShowEditModal(false);
      setSelectedContact(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error: any) => {
      showError(
        t("contacts.error", "Error"),
        error.response?.data?.error ||
          t("contacts.updateFailed", "Failed to update contact"),
      );
    },
  });

  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`contacts/${id}/`);
      return response.data;
    },
    onSuccess: () => {
      showSuccess(
        t("contacts.deleted", "Contact Deleted"),
        t("contacts.deletedMessage", "Contact has been removed"),
      );
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error: any) => {
      showError(
        t("contacts.error", "Error"),
        error.response?.data?.error ||
          t("contacts.deleteFailed", "Failed to delete contact"),
      );
    },
  });

  const resetForm = () => {
    setContactName("");
    setContactPhone("");
    setContactNotes("");
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAddContact = () => {
    if (!contactName.trim()) {
      showError(
        t("contacts.error", "Error"),
        t("contacts.nameRequired", "Name is required"),
      );
      return;
    }
    if (!contactPhone.trim()) {
      showError(
        t("contacts.error", "Error"),
        t("contacts.phoneRequired", "Phone number is required"),
      );
      return;
    }

    addContactMutation.mutate({
      name: contactName.trim(),
      phone_number: normalizePhoneNumber(contactPhone.trim()),
      notes: contactNotes.trim(),
    });
  };

  const handleUpdateContact = () => {
    if (!selectedContact) return;
    if (!contactName.trim()) {
      showError(
        t("contacts.error", "Error"),
        t("contacts.nameRequired", "Name is required"),
      );
      return;
    }

    updateContactMutation.mutate({
      id: selectedContact.id,
      data: {
        name: contactName.trim(),
        phone_number: normalizePhoneNumber(contactPhone.trim()),
        notes: contactNotes.trim(),
      },
    });
  };

  const handleDeleteContact = (contact: Contact) => {
    Alert.alert(
      t("contacts.confirmDelete", "Delete Contact"),
      t(
        "contacts.confirmDeleteMessage",
        `Are you sure you want to delete ${contact.name}?`,
      ),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("common.delete", "Delete"),
          style: "destructive",
          onPress: () => deleteContactMutation.mutate(contact.id),
        },
      ],
    );
  };

  const openEditModal = (contact: Contact) => {
    setSelectedContact(contact);
    setContactName(contact.name);
    setContactPhone(contact.phone_number);
    setContactNotes(contact.notes || "");
    setShowEditModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

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
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder={t("contacts.search", "Search contacts...")}
          placeholderTextColor={Colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Contacts List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={
            contacts.length === 0 ? styles.emptyList : undefined
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => openEditModal(item)}
            >
              <View style={styles.avatarContainer}>
                <Ionicons
                  name="person-circle"
                  size={50}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactPhone}>
                  {formatPhoneNumber(item.phone_number)}
                </Text>
                {item.notes ? (
                  <Text style={styles.contactNotes} numberOfLines={1}>
                    {item.notes}
                  </Text>
                ) : null}
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/messages",
                      params: { other_party: item.phone_number },
                    })
                  }
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={22}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDeleteContact(item)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color={Colors.error}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={64}
                color={Colors.textLight}
              />
              <Text style={styles.emptyTitle}>
                {t("contacts.noContacts", "No contacts yet")}
              </Text>
              <Text style={styles.emptySubtitle}>
                {t(
                  "contacts.noContactsMessage",
                  "Add contacts from call history or tap the + button",
                )}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={openAddModal}
              >
                <Text style={styles.emptyButtonText}>
                  {t("contacts.addContact", "Add Contact")}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add Contact Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("contacts.addContact", "Add Contact")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>
                {t("contacts.name", "Name")} *
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={t("contacts.enterName", "Enter name")}
                placeholderTextColor={Colors.textLight}
                value={contactName}
                onChangeText={setContactName}
              />

              <Text style={styles.inputLabel}>
                {t("contacts.phone", "Phone")} *
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={t("contacts.enterPhone", "+1234567890")}
                placeholderTextColor={Colors.textLight}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>
                {t("contacts.notes", "Notes")}
              </Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                placeholder={t("contacts.enterNotes", "Optional notes...")}
                placeholderTextColor={Colors.textLight}
                value={contactNotes}
                onChangeText={setContactNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                addContactMutation.isPending && styles.saveButtonDisabled,
              ]}
              onPress={handleAddContact}
              disabled={addContactMutation.isPending}
            >
              {addContactMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.textWhite} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {t("contacts.save", "Save Contact")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("contacts.editContact", "Edit Contact")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>
                {t("contacts.name", "Name")} *
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={t("contacts.enterName", "Enter name")}
                placeholderTextColor={Colors.textLight}
                value={contactName}
                onChangeText={setContactName}
              />

              <Text style={styles.inputLabel}>
                {t("contacts.phone", "Phone")} *
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={t("contacts.enterPhone", "+1234567890")}
                placeholderTextColor={Colors.textLight}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>
                {t("contacts.notes", "Notes")}
              </Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                placeholder={t("contacts.enterNotes", "Optional notes...")}
                placeholderTextColor={Colors.textLight}
                value={contactNotes}
                onChangeText={setContactNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                updateContactMutation.isPending && styles.saveButtonDisabled,
              ]}
              onPress={handleUpdateContact}
              disabled={updateContactMutation.isPending}
            >
              {updateContactMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.textWhite} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {t("contacts.update", "Update Contact")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    paddingTop: 60,
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
  contactNotes: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 2,
    fontStyle: "italic",
  },
  contactActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    padding: 8,
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textInputMultiline: {
    height: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: "600",
  },
});
