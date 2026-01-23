import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { Colors } from "@/app/utils/colors";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { clearStorage, clearAuthData } from "@/app/utils/storage";
import { router } from "expo-router";
import { useAgentQuery, useAgentPhoneNumber } from "@/app/utils/hooks";
import { showWarning } from "@/app/utils/toast";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { data: agentConfig } = useAgentQuery();
  const { phoneNumber } = useAgentPhoneNumber(agentConfig?.id);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Check notification permissions on mount
  useEffect(() => {
    const checkNotificationPermissions = async () => {
      try {
        const NotificationService = (
          await import("../notifications/NotificationService")
        ).default;
        const notificationService = NotificationService.getInstance();
        await notificationService.initialize();
        const authToken = await AsyncStorage.getItem("authToken");
        setNotificationsEnabled(!!authToken);
      } catch (error) {
        console.error("Error checking notification permissions:", error);
      }
    };
    checkNotificationPermissions();
  }, []);

  // Handle notification toggle
  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      try {
        const NotificationService = (
          await import("../notifications/NotificationService")
        ).default;
        const notificationService = NotificationService.getInstance();
        await notificationService.initialize();
        const token = await notificationService.requestPermissionsAndRegister();
        if (token) {
          await notificationService.sendTokenToServer();
          setNotificationsEnabled(true);
        } else {
          setNotificationsEnabled(false);
          showWarning(
            t("settings.permissionDenied", "Permission Denied"),
            t(
              "settings.notificationPermissionMessage",
              "Please enable notifications in your device settings.",
            ),
          );
        }
      } catch (error) {
        console.error("Error enabling notifications:", error);
        setNotificationsEnabled(false);
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const changeLanguage = () => {
    const newLang = i18n.language === "en" ? "es" : "en";
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    showWarning(
      t("settings.logoutTitle", "Logout"),
      t("settings.logoutMessage", "Are you sure you want to logout?"),
    );
    // Give user time to read the message before logging out
    setTimeout(async () => {
      await clearAuthData();
      router.replace("/login" as any);
    }, 2000);
  };

  const handleDeleteAgent = () => {
    showWarning(
      t("settings.deleteAgentTitle", "Delete Agent"),
      t(
        "settings.deleteAgentMessage",
        "This will permanently delete your agent. This action cannot be undone.",
      ),
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("settings.title", "Settings")}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t("settings.subtitle", "Manage your preferences")}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("settings.account", "Account")}
          </Text>

          <View style={styles.settingCard}>
            <View style={styles.agentInfo}>
              <View style={styles.agentAvatar}>
                <Ionicons
                  name={agentConfig?.agentGender === "female" ? "woman" : "man"}
                  size={32}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.agentDetails}>
                <Text style={styles.agentName}>
                  {agentConfig?.agentName || t("settings.agent", "Agent")}
                </Text>
                <Text style={styles.agentCompany}>
                  {agentConfig?.companyName || t("settings.company", "Company")}
                </Text>
                {phoneNumber && (
                  <View style={styles.agentPhoneRow}>
                    <Ionicons name="call" size={14} color={Colors.primary} />
                    <Text style={styles.agentPhone}>{phoneNumber}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/edit-agent")}
          >
            <Ionicons name="settings-outline" size={24} color="#666" />
            <Text style={styles.settingItemText}>
              {t("settings.editAgent", "Edit Agent Settings")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/call-forwarding" as any)}
          >
            <Ionicons name="git-branch-outline" size={24} color="#666" />
            <Text style={styles.settingItemText}>
              {t("settings.callForwarding", "Call Forwarding")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("settings.preferences", "Preferences")}
          </Text>

          <View style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
            <Text style={styles.settingItemText}>
              {t("settings.notifications", "Notifications")}
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: "#d1d1d6", true: "#34C759" }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <Ionicons name="volume-high-outline" size={24} color="#666" />
            <Text style={styles.settingItemText}>
              {t("settings.sound", "Sound")}
            </Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: "#d1d1d6", true: "#34C759" }}
              thumbColor="#fff"
            />
          </View>

          {/* <TouchableOpacity style={styles.settingItem} onPress={changeLanguage}>
            <Ionicons name="language-outline" size={24} color="#666" />
            <Text style={styles.settingItemText}>
              {t("settings.language", "Language")}
            </Text>
            <Text style={styles.settingItemValue}>
              {i18n.language === "en" ? "English" : "Español"}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity> */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("settings.reports", "Reports")}
          </Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/analytics")}
          >
            <Ionicons name="analytics-outline" size={24} color="#666" />
            <Text style={styles.settingItemText}>
              {t("settings.analytics", "Agent Analytics")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push("/call-history")}
          >
            <Ionicons name="list-outline" size={24} color="#666" />
            <Text style={styles.settingItemText}>
              {t("settings.callHistory", "Full Call History")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("settings.support", "Support")}
          </Text>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={24} color="#666" />
            <Text style={styles.settingItemText}>
              {t("settings.help", "Help & Support")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="document-text-outline" size={24} color="#666" />
            <Text style={styles.settingItemText}>
              {t("settings.terms", "Terms & Conditions")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="shield-outline" size={24} color="#666" />
            <Text style={styles.settingItemText}>
              {t("settings.privacy", "Privacy Policy")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("settings.dangerZone", "Danger Zone")}
          </Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleDeleteAgent}
          >
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            <Text style={[styles.settingItemText, { color: "#FF3B30" }]}>
              {t("settings.deleteAgent", "Delete Agent")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={[styles.settingItemText, { color: "#FF3B30" }]}>
              {t("settings.logout", "Logout")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>EasyAgent v1.0.0</Text>
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
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  settingCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  agentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  agentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  agentCompany: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  agentPhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  agentPhone: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
  settingItem: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingItemText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: 16,
  },
  settingItemValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  versionContainer: {
    padding: 24,
    alignItems: "center",
  },
  versionText: {
    fontSize: 14,
    color: "#999",
  },
});
