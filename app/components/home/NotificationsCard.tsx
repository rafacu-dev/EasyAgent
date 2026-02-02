/**
 * NotificationsCard Component
 *
 * Displays new calls and appointments notifications
 */

import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { Colors } from "@/app/utils/colors";
import { SkeletonBar } from "./SkeletonBar";

interface NotificationsCardProps {
  newCalls: number;
  newAppointments: number;
  isLoading: boolean;
}

export const NotificationsCard = memo(function NotificationsCard({
  newCalls,
  newAppointments,
  isLoading,
}: NotificationsCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={20} color={Colors.primary} />
        <Text style={styles.title}>
          {t("home.notifications", "New Activity")}
        </Text>
      </View>
      {isLoading ? (
        <View style={styles.content}>
          <SkeletonBar width="100%" height={40} />
        </View>
      ) : (
        <View style={styles.content}>
          {/* New Calls */}
          <View style={styles.item}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={["#3B82F6", "#60A5FA"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="call" size={16} color="#fff" />
              </LinearGradient>
            </View>
            <View style={styles.info}>
              <Text style={styles.count}>{newCalls}</Text>
              <Text style={styles.label}>
                {t("home.newCalls", "New Calls")}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Upcoming Appointments */}
          <View style={styles.item}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={["#10B981", "#34D399"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="calendar" size={16} color="#fff" />
              </LinearGradient>
            </View>
            <View style={styles.info}>
              <Text style={styles.count}>{newAppointments}</Text>
              <Text style={styles.label}>
                {t("home.upcomingAppointments", "Upcoming")}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  item: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
  },
  iconGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  count: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
  },
});

export default NotificationsCard;
