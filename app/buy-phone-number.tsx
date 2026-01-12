import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Colors } from "../utils/colors";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { router } from "expo-router";
import { apiClient } from "../utils/axios-interceptor";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAgent } from "../utils/AgentContext";

interface AvailableNumber {
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

export default function BuyPhoneNumberScreen() {
  const { t } = useTranslation();
  const { agentConfig, refreshPhoneNumber } = useAgent();
  const [areaCode, setAreaCode] = useState("");
  const [contains, setContains] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);

  const {
    data: numbersResp,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["available-numbers", areaCode, contains],
    queryFn: async () => {
      const payload: any = {
        country_code: "US",
        limit: 20,
      };
      if (areaCode) payload.area_code = areaCode;
      if (contains) payload.contains = contains;

      return apiClient.post("phone-numbers/search-available/", payload);
    },
    enabled: false, // Only fetch when user clicks search
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
      Alert.alert(
        t("buyPhone.success", "Success!"),
        t(
          "buyPhone.purchaseSuccess",
          "Phone number purchased and linked to your agent successfully!"
        ),
        [
          {
            text: t("common.ok", "OK"),
            onPress: () => {
              refreshPhoneNumber();
              router.back();
            },
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        t("buyPhone.error", "Error"),
        error?.error ||
          t("buyPhone.purchaseError", "Failed to purchase phone number")
      );
    },
  });

  const handlePurchase = (phoneNumber: string) => {
    Alert.alert(
      t("buyPhone.confirmTitle", "Confirm Purchase"),
      t(
        "buyPhone.confirmMessage",
        `This number will cost $2.00. Are you sure you want to purchase ${phoneNumber}?`
      ),
      [
        {
          text: t("common.cancel", "Cancel"),
          style: "cancel",
        },
        {
          text: t("buyPhone.purchase", "Purchase"),
          style: "default",
          onPress: () => purchaseMutation.mutate(phoneNumber),
        },
      ]
    );
  };

  const handleSearch = () => {
    refetch();
  };

  const renderNumberItem = ({ item }: { item: AvailableNumber }) => (
    <View style={styles.numberCard}>
      <View style={styles.numberInfo}>
        <View style={styles.numberHeader}>
          <Ionicons
            name="call"
            size={20}
            color={Colors.primary}
            style={styles.numberIcon}
          />
          <Text style={styles.phoneNumber}>{item.phone_number}</Text>
        </View>

        {(item.locality || item.region) && (
          <Text style={styles.numberLocation}>
            {[item.locality, item.region].filter(Boolean).join(", ")}
          </Text>
        )}

        <View style={styles.capabilitiesContainer}>
          {item.capabilities?.voice && (
            <View style={styles.capabilityBadge}>
              <Ionicons name="call" size={12} color={Colors.success} />
              <Text style={styles.capabilityText}>Voice</Text>
            </View>
          )}
          {item.capabilities?.SMS && (
            <View style={styles.capabilityBadge}>
              <Ionicons name="chatbubble" size={12} color={Colors.info} />
              <Text style={styles.capabilityText}>SMS</Text>
            </View>
          )}
          {item.capabilities?.MMS && (
            <View style={styles.capabilityBadge}>
              <Ionicons name="image" size={12} color={Colors.info} />
              <Text style={styles.capabilityText}>MMS</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.buyButton,
          purchaseMutation.isPending && styles.buyButtonDisabled,
        ]}
        onPress={() => handlePurchase(item.phone_number)}
        disabled={purchaseMutation.isPending}
      >
        {purchaseMutation.isPending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="card" size={16} color="#fff" />
            <Text style={styles.buyButtonText}>
              {t("buyPhone.buy", "$2.00")}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const ListHeaderComponent = () => (
    <>
      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>
            {t("buyPhone.searchTitle", "Search for Numbers")}
          </Text>
          <TouchableOpacity
            onPress={() => setShowInfoModal(true)}
            style={styles.infoButton}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchInputContainer, styles.searchInputHalf]}>
            <Ionicons
              name="location"
              size={20}
              color={Colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t(
                "buyPhone.areaCodePlaceholder",
                "Area code (e.g., 415)"
              )}
              placeholderTextColor={Colors.textLight}
              value={areaCode}
              onChangeText={setAreaCode}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          <View style={[styles.searchInputContainer, styles.searchInputHalf]}>
            <Ionicons
              name="search"
              size={20}
              color={Colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t(
                "buyPhone.containsPlaceholder",
                "Contains digits (optional)"
              )}
              placeholderTextColor={Colors.textLight}
              value={contains}
              onChangeText={setContains}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.searchButtonText}>
                {t("buyPhone.search", "Search Numbers")}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={24} color={Colors.error} />
          <Text style={styles.errorText}>
            {(error as any)?.error ||
              t("buyPhone.searchError", "Error searching for numbers")}
          </Text>
        </View>
      )}

      {/* Section Title for List */}
      {availableNumbers.length > 0 && (
        <View style={styles.listTitleContainer}>
          <Text style={styles.sectionTitle}>
            {t("buyPhone.availableNumbers", "Available Numbers")} (
            {availableNumbers.length})
          </Text>
        </View>
      )}
    </>
  );

  const ListEmptyComponent = () => {
    if (isLoading) return null;
    if (error) return null;

    return (
      <View style={styles.emptyState}>
        <Ionicons name="call-outline" size={64} color={Colors.textLight} />
        <Text style={styles.emptyStateText}>
          {t("buyPhone.noNumbers", "No numbers found")}
        </Text>
        <Text style={styles.emptyStateSubtext}>
          {t(
            "buyPhone.searchToFind",
            "Use the search above to find available phone numbers"
          )}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t("buyPhone.title", "Buy Phone Number")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* FlatList with Header */}
      <FlatList
        data={availableNumbers}
        renderItem={renderNumberItem}
        keyExtractor={(item, index) => `${item.phone_number}-${index}`}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowInfoModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons
                name="information-circle"
                size={32}
                color={Colors.primary}
              />
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalTitle}>
              {t("buyPhone.infoTitle", "About Phone Numbers")}
            </Text>
            <Text style={styles.modalText}>
              {t(
                "buyPhone.info",
                "Purchase a phone number to enable calls and recordings with your AI agent. Each number costs $2.00."
              )}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.modalButtonText}>{t("common.ok", "OK")}</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  listContent: {
    paddingBottom: 20,
  },
  errorCard: {
    flexDirection: "row",
    backgroundColor: Colors.error + "15",
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: "flex-start",
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
    lineHeight: 20,
  },
  searchSection: {
    padding: 16,
    paddingTop: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoButton: {
    padding: 4,
  },
  searchRow: {
    flexDirection: "row",
    gap: 12,
  },
  searchInputHalf: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  listTitleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  searchButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  numberCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  numberInfo: {
    flex: 1,
    marginRight: 12,
  },
  numberHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  numberIcon: {
    marginRight: 8,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  numberLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  capabilitiesContainer: {
    flexDirection: "row",
    gap: 6,
  },
  capabilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  capabilityText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  buyButton: {
    flexDirection: "row",
    backgroundColor: Colors.success,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    gap: 6,
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
