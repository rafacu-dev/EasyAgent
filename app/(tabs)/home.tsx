/**
 * Home Screen
 *
 * Dashboard with recent calls, notifications, and call filtering
 * Uses useHome hook for state management and home components for UI
 */

import { View, Text, TouchableOpacity, StyleSheet, Linking, ScrollView, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Colors } from "@/app/utils/colors";
import { useHome } from "@/app/hooks/useHome";
import { useSubscription } from "@/app/hooks/useSubscription";
import NoPhoneNumber from "@/app/components/NoPhoneNumber";
import { useCallback } from "react";
import {
  NotificationsCard,
  CallsFilter,
  SearchBar,
  CallsList,
} from "@/app/components/home";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { isProUser, refresh } = useSubscription();

  // Refrescar el estado de suscripción cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const {
    // Loading states
    isLoadingAgent,
    isLoadingPhone,
    isLoadingCalls,
    isLoadingNotifications,

    // Data
    agentConfig,
    phoneNumber,
    callSections,
    notifications,
    error,

    // Filter
    callTypeFilter,
    setCallTypeFilter,

    // Search
    searchQuery,
    setSearchQuery,

    // Refresh
    refreshing,
    onRefresh,
  } = useHome();

  // Header component used in all states
  const Header = () => (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {t("home.welcome", "Welcome")},{" "}
          {agentConfig?.companyName ||
            t("home.yourDashboard", "Your Dashboard")}
        </Text>
        <TouchableOpacity
          style={styles.supportButton}
          onPress={() => Linking.openURL("sms:+13522784162")}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={"black"} />
          <Text style={styles.supportButtonText}>
            {t("home.support", "Soporte")}
          </Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.headerSubtitle}>{error}</Text>}
    </View>
  );

  // Loading state
  if (isLoadingAgent || isLoadingPhone || !agentConfig) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.centered}>
          <Text style={styles.loadingText}>
            {t("home.loading", "Loading...")}
          </Text>
        </View>
      </View>
    );
  }

  // No phone number view
  if (!phoneNumber) {
    return (
      <View style={styles.container}>
        <Header />
        <NoPhoneNumber variant="detailed" translationPrefix="home" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Upgrade to Pro Button - Solo visible si NO es usuario Pro */}
        {!isProUser && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => router.push("/paywall/PaywallScreen")}
            activeOpacity={0.8}
          >
            <Ionicons name="star" size={20} color="#fff" style={styles.upgradeIcon} />
            <Text style={styles.upgradeButtonText}>
              {t("home.upgradeToPro", "Actualizar a Pro")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Notifications Card */}
        <NotificationsCard
          newCalls={notifications?.newCalls ?? 0}
          newAppointments={notifications?.newAppointments ?? 0}
          isLoading={isLoadingNotifications}
          phoneNumber={phoneNumber}
        />

        {/* Calls Filter */}
        <CallsFilter filter={callTypeFilter} onFilterChange={setCallTypeFilter} />

        {/* Search Bar */}
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {/* Calls List */}
        <CallsList
          sections={callSections}
          isLoading={isLoadingCalls}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: Colors.background,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.textSecondary,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeIcon: {
    marginRight: 8,
  },
  upgradeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  supportButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  supportButtonText: {
    fontSize: 8,
    marginTop: 2,
    fontWeight: "700",
  },
});
