import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Colors } from "../../utils/colors";
import { router } from "expo-router";
import { useAgent } from "../../utils/AgentContext";

// Mock call data
const mockCalls = [
  {
    id: "1",
    number: "+1 555-0123",
    duration: "5:23",
    date: "2025-12-27",
    status: "completed",
  },
  {
    id: "2",
    number: "+1 555-0456",
    duration: "3:15",
    date: "2025-12-27",
    status: "completed",
  },
  {
    id: "3",
    number: "+1 555-0789",
    duration: "8:42",
    date: "2025-12-26",
    status: "completed",
  },
  {
    id: "4",
    number: "+1 555-0321",
    duration: "2:10",
    date: "2025-12-26",
    status: "missed",
  },
  {
    id: "5",
    number: "+1 555-0654",
    duration: "6:55",
    date: "2025-12-25",
    status: "completed",
  },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const { agentConfig } = useAgent();
  const [calls, setCalls] = useState(mockCalls);

  const renderCallItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.callItem}>
      <View
        style={[
          styles.callStatusDot,
          item.status === "missed" && styles.callStatusMissed,
        ]}
      />
      <View style={styles.callInfo}>
        <Text style={styles.callNumber}>{item.number}</Text>
        <Text style={styles.callDate}>{item.date}</Text>
      </View>
      <Text style={styles.callDuration}>{item.duration}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Welcome and Agent Name */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("home.welcome", "Welcome")},{" "}
            {agentConfig?.companyName ||
              t("home.yourDashboard", "Your Dashboard")}
          </Text>
        </View>

        {/* Agent Card */}
        <View style={styles.agentCardContainer}>
          <TouchableOpacity 
            style={styles.agentCard}
            onPress={() => router.push("/edit-agent")}
          >
            <View style={styles.agentAvatar}>
              <Ionicons
                name={agentConfig?.agentGender === "female" ? "woman" : "man"}
                size={32}
                color={Colors.primary}
              />
            </View>
            <View style={styles.agentDetails}>
              <Text style={styles.agentName}>
                {agentConfig?.agentName || t("home.agent", "Agent")}
              </Text>
              <Text style={styles.agentSector}>
                {t(`templates.${agentConfig?.sector}` || "General")}
              </Text>
            </View>
            <Ionicons
              name="settings-outline"
              size={20}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Stats Container */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="call" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>
              {t("home.totalCalls", "Total Calls")}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="time" size={20} color={Colors.success} />
            </View>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>
              {t("home.activeCalls", "Active Calls")}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="trending-up" size={20} color={Colors.info} />
            </View>
            <Text style={styles.statValue}>18m</Text>
            <Text style={styles.statLabel}>
              {t("home.avgDuration", "Avg Time")}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="call" size={18} color={Colors.primary} />
            <Text style={styles.actionButtonText}>
              {t("home.makeCall", "Make Call")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text" size={18} color={Colors.primary} />
            <Text style={styles.actionButtonText}>
              {t("home.viewLogs", "Call Logs")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="analytics" size={18} color={Colors.primary} />
            <Text style={styles.actionButtonText}>
              {t("home.analytics", "Analytics")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Calls List */}
        <View style={styles.callsListContainer}>
          <Text style={styles.sectionTitle}>
            {t("home.recentCalls", "Recent Calls")}
          </Text>
          <FlatList
            data={calls}
            renderItem={renderCallItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            style={styles.callsList}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 12,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  agentCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  agentCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: Colors.shadowOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  agentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  agentSector: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  quickActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 12,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginTop: 6,
    fontWeight: "600",
    textAlign: "center",
  },
  callsListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  callsList: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  callItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  callStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.statusActive,
    marginRight: 12,
  },
  callStatusMissed: {
    backgroundColor: Colors.statusMissed,
  },
  callInfo: {
    flex: 1,
  },
  callNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  callDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  callDuration: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 8,
    fontWeight: "500",
  },
});
