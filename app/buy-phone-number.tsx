import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import { PhoneSearchHeader } from "./components/PhoneSearchHeader";
import { useBuyPhoneNumber } from "@/app/hooks/useBuyPhoneNumber";
import { NumberCard, InfoModal } from "@/app/components/buy-phone-number";

export default function BuyPhoneNumberScreen() {
  const { t } = useTranslation();
  const {
    areaCode,
    setAreaCode,
    contains,
    setContains,
    handleSearch,
    showInfoModal,
    setShowInfoModal,
    availableNumbers,
    isLoading,
    error,
    handlePurchase,
    isPurchasing,
  } = useBuyPhoneNumber();

  const ListEmptyComponent = () => {
    if (isLoading) return null;
    if (error) return null;

    return (
      <View style={styles.emptyState}>
        <Ionicons name="call-outline" size={64} color={Colors.textLight} />
        <Text style={styles.emptyStateText}>
          {t("getPhone.noNumbers", "No numbers found")}
        </Text>
        <Text style={styles.emptyStateSubtext}>
          {t(
            "getPhone.filterToFind",
            "Use the filters above to find specific phone numbers"
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
          {t("getPhone.title", "Get Phone Number")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Header */}
      <PhoneSearchHeader
        areaCode={areaCode}
        setAreaCode={setAreaCode}
        contains={contains}
        setContains={setContains}
        isLoading={isLoading}
        error={error}
        availableNumbersCount={availableNumbers.length}
        onSearch={handleSearch}
        onInfoPress={() => setShowInfoModal(true)}
        t={t}
      />

      {/* Results List */}
      <FlatList
        data={availableNumbers}
        renderItem={({ item }) => (
          <NumberCard
            item={item}
            onPurchase={handlePurchase}
            isPurchasing={isPurchasing}
          />
        )}
        keyExtractor={(item, index) => `${item.phone_number}-${index}`}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Info Modal */}
      <InfoModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
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
});
