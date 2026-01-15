import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../utils/colors";
import { Ionicons } from "@expo/vector-icons";

interface PhoneSearchHeaderProps {
  areaCode: string;
  setAreaCode: (value: string) => void;
  contains: string;
  setContains: (value: string) => void;
  isLoading: boolean;
  error: any;
  availableNumbersCount: number;
  onSearch: () => void;
  onInfoPress: () => void;
  t: (key: string, fallback: string) => string;
}

export function PhoneSearchHeader({
  areaCode,
  setAreaCode,
  contains,
  setContains,
  isLoading,
  error,
  availableNumbersCount,
  onSearch,
  onInfoPress,
  t,
}: PhoneSearchHeaderProps) {
  return (
    <>
      {/* Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>
            {t("getPhone.filterTitle", "Filter Numbers")}
          </Text>
          <TouchableOpacity onPress={onInfoPress} style={styles.infoButton}>
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
              placeholder={t("getPhone.areaCodePlaceholder", "Area code")}
              placeholderTextColor={Colors.textLight}
              value={areaCode}
              onChangeText={setAreaCode}
              keyboardType="number-pad"
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
              placeholder={t("getPhone.containsPlaceholder", "Contains digits")}
              placeholderTextColor={Colors.textLight}
              value={contains}
              onChangeText={setContains}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={onSearch}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="funnel" size={20} color="#fff" />
              <Text style={styles.searchButtonText}>
                {t("getPhone.applyFilters", "Apply Filters")}
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
            {error?.error ||
              t("getPhone.loadError", "Error loading phone numbers")}
          </Text>
        </View>
      )}

      {/* Section Title for List */}
      {availableNumbersCount > 0 && (
        <View style={styles.listTitleContainer}>
          <Text style={styles.sectionTitle}>
            {t("getPhone.availableNumbers", "Available Numbers")} (
            {availableNumbersCount})
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
});
