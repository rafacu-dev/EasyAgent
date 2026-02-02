/**
 * SearchBar Component
 *
 * Search input for filtering calls
 */

import React, { memo } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar = memo(function SearchBar({
  value,
  onChangeText,
  placeholder,
}: SearchBarProps) {
  const { t } = useTranslation();
  const defaultPlaceholder =
    placeholder || t("home.searchCalls", "Search calls...");

  return (
    <View style={styles.container}>
      <Ionicons
        name="search"
        size={18}
        color={Colors.textLight}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        placeholder={defaultPlaceholder}
        placeholderTextColor={Colors.textLight}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")}>
          <Ionicons name="close-circle" size={18} color={Colors.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
});

export default SearchBar;
