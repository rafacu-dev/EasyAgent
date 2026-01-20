import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SectionList,
    TextInput,
    Alert,
    Linking,
    Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import Constants from "expo-constants";
import { Ionicons, SimpleLineIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Colors } from "../../utils/colors";
import { router } from "expo-router";
import { useAgentQuery, useAgentPhoneNumber } from "../../utils/hooks";
import { apiClient } from "../../utils/axios-interceptor";
import { useQuery } from "@tanstack/react-query";
import { getLastLogin } from "../../utils/storage";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";
import type { RecentCallItem } from "../../utils/types";
import NoPhoneNumber from "../../components/NoPhoneNumber";
import { formatDuration, formatDateWithWeekday } from "../../utils/formatters";
import { getConfig } from "@/utils/services";

// RecentCallItem type moved to global `utils/types.d.ts`

// Removed mock data; now using live API via React Query

export default function HomeScreen() {
    const { t, i18n } = useTranslation();
    const { data: agentConfig, isLoading: isLoadingAgent } = useAgentQuery();
    const { phoneNumber, isLoading: isLoadingPhone } = useAgentPhoneNumber(
        agentConfig?.id
    );
    const [callTypeFilter, setCallTypeFilter] = useState<
        "all" | "inbound" | "outbound"
    >("all");
    const [searchQuery, setSearchQuery] = useState("");

    const agentDbId = agentConfig?.id ?? null;
    const currentLocale = i18n.language;

    // Stats query
    const {
        data: statsResp,
        isLoading: statsLoading,
        error: statsErr,
    } = useQuery({
        queryKey: ["agent-stats", agentDbId],
        enabled: !!agentDbId,
        queryFn: () => apiClient.get(`agents/${agentDbId}/call-traffic/`),
    });

    const statistics = statsResp?.statistics ?? {};
    const stats = {
        totalCalls: statistics.total_calls ?? 0,
        ongoingCalls: statistics.ongoing_calls ?? 0,
        totalDurationMinutes: statistics.total_duration_minutes ?? 0,
    };

    // Recent calls limited to 10
    const {
        data: callsResp,
        isLoading: callsLoading,
        error: callsErr,
    } = useQuery({
        queryKey: ["recent-calls", agentDbId, callTypeFilter],
        enabled: !!agentDbId,
        queryFn: () => {
            const directionParam =
                callTypeFilter === "all" ? "" : `&direction=${callTypeFilter}`;
            return apiClient.get(
                `calls/?agent_id=${encodeURIComponent(
                    String(agentDbId)
                )}&limit=10&sort_order=descending${directionParam}`
            );
        },
    });

    // Notifications query - new items since last login
    const { data: notificationsResp, isLoading: notificationsLoading } = useQuery(
        {
            queryKey: ["notifications", agentDbId],
            enabled: !!agentDbId,
            queryFn: async () => {
                const lastLogin = await getLastLogin();
                const lastLoginParam = lastLogin
                    ? `?after_datetime=${encodeURIComponent(lastLogin)}`
                    : "";

                // Get new calls and appointments counts
                const [callsData, appointmentsData] = await Promise.all([
                    apiClient.get(
                        `calls/?agent_id=${encodeURIComponent(
                            String(agentDbId)
                        )}&limit=5&sort_order=descending${
                            lastLogin
                                ? `&after_datetime=${encodeURIComponent(lastLogin)}`
                                : ""
                        }`
                    ),
                    apiClient.get(`appointments/${lastLoginParam}`),
                ]);

                return {
                    newCalls: callsData?.calls?.length ?? 0,
                    newAppointments: appointmentsData?.data?.length ?? 0,
                };
            },
        }
    );

    const callSections = useMemo(() => {
        const rawCalls: any[] = callsResp?.calls ?? [];
        const callsByDate: { [key: string]: RecentCallItem[] } = {};

        rawCalls.forEach((c: any) => {
            const direction = c?.direction;
            const number = direction === "inbound" ? c?.from_number : c?.to_number;
            const date = formatDateWithWeekday(c?.start_timestamp, currentLocale);

            const call: RecentCallItem = {
                id: c?.call_id ?? `${c?.start_timestamp ?? Math.random()}`,
                number: number ?? "Unknown",
                duration: formatDuration(c?.duration_ms),
                date,
                status: c?.call_status ?? "",
                direction: direction ?? "unknown",
                fromNumber: c?.from_number ?? "Unknown",
                toNumber: c?.to_number ?? "Unknown",
            };

            // Filter by search query
            if (searchQuery.length > 0) {
                const query = searchQuery.toLowerCase();
                const matchesNumber = number?.toLowerCase().includes(query);
                const matchesFrom = c?.from_number?.toLowerCase().includes(query);
                const matchesTo = c?.to_number?.toLowerCase().includes(query);

                if (!matchesNumber && !matchesFrom && !matchesTo) {
                    return;
                }
            }

            if (!callsByDate[date]) {
                callsByDate[date] = [];
            }
            callsByDate[date].push(call);
        });

        return Object.keys(callsByDate)
            .sort((a, b) => b.localeCompare(a))
            .map((date) => ({
                title: date,
                data: callsByDate[date],
            }));
    }, [callsResp, searchQuery]);

    const error = (statsErr || callsErr)?.message as string | undefined;

    // Initialize notifications system
    useEffect(() => {
        const initializeNotifications = async () => {
            try {
                const NotificationService = (await import('../notifications/NotificationService')).default;
                const notificationService = NotificationService.getInstance();
                
                // First initialize (without permissions)
                await notificationService.initialize();
                
                // Then request permissions
                const token = await notificationService.requestPermissionsAndRegister();
                if (token) {
                    console.log('✅ Notification token obtained:', token);
                    // Send token to server
                    await notificationService.sendTokenToServer();
                }
            } catch (notifError) {
                console.error('Error initializing notifications:', notifError);
            }
        };

        initializeNotifications();
    }, []);
    
    useEffect(() => {
        const checkForUpdates = () => {
            const appVersion = parseFloat(Constants.expoConfig?.version || "0.0");
            
            getConfig()
            .then((response) => {
                const storeUrl = Platform.OS === 'ios' ? response['update_url_ios'] : response['update_url_android']
                if (appVersion < response["min_version"]) {
                    Alert.alert(
                        t('index.updateApp'),
                        t('index.updateAppMsg'),
                        [
                            {
                                text: t('index.updateButton'),
                                onPress: () => {
                                    Linking.openURL(storeUrl);
                                },
                            },
                        ],
                        { cancelable: false }
                    );
                }
                else if (appVersion < response["current_version"]) {
                    Alert.alert(
                        t('index.updateAppAvailable'),
                        t('index.updateAppMsgAvailable'),
                        [
                            {
                                text: t('index.updateButton'),
                                onPress: () => {
                                    Linking.openURL(storeUrl);
                                },
                            },
                            { text: t('index.later'), onPress: () => {} }
                        ],
                        { cancelable: true }
                    );
                }
            });
        };
        checkForUpdates();
    }, [t]);

    // Animated loading skeleton helpers
    const pulse = useSharedValue(0.6);
    pulse.value = withTiming(1, { duration: 800 });
    const skeletonStyle = useAnimatedStyle(() => ({
        opacity: pulse.value,
    }));

    const SkeletonBar = ({
        width,
        height,
        style,
    }: {
        width: number | string;
        height: number;
        style?: any;
    }) => (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius: 8,
                    backgroundColor: Colors.backgroundLight,
                    marginVertical: 6,
                },
                skeletonStyle,
                style,
            ]}
        />
    );

    const renderCallItem = ({ item }: { item: RecentCallItem }) => (
        <TouchableOpacity
            style={styles.callItem}
            onPress={() =>
                router.push({ pathname: "/call-details/[id]", params: { id: item.id } })
            }
        >
            <View style={styles.callAvatarContainer}>
                <LinearGradient
                    colors={[Colors.primary, "#ffc09cff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.callAvatar}
                >
                    <Ionicons name="person" size={20} color="#fff" />
                </LinearGradient>
                <View
                    style={[
                        styles.callDirectionBadge,
                        {
                            backgroundColor:
                                item.direction === "inbound" ? "#10B981" : "#3B82F6",
                        },
                    ]}
                >
                    <Ionicons
                        name={item.direction === "inbound" ? "arrow-down" : "arrow-up"}
                        size={10}
                        color="#fff"
                    />
                </View>
            </View>
            <View style={styles.callInfo}>
                <View style={styles.callNumberRow}>
                    <Text style={styles.callNumber}>{item.number}</Text>
                </View>
                <Text style={styles.callTime}>{item.duration}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
        </TouchableOpacity>
    );

    const renderSectionHeader = ({ section }: { section: { title: string } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
        </View>
    );

    const ListHeaderComponent = () => (
        <>
            {/* Header with Welcome and Agent Name */}
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <Text style={styles.headerTitle}>
                        {t("home.welcome", "Welcome")},{" "}
                        {agentConfig?.companyName ||
                            t("home.yourDashboard", "Your Dashboard")}
                    </Text>
                </View>
                {error ? <Text style={styles.headerSubtitle}>{error}</Text> : null}
            </View>
            {Constants.appOwnership === "expo" && (
                <TouchableOpacity
                    style={styles.expoGoButton}
                    onPress={() => router.push("/paywall/PaywallScreen")}
                >
                    <Ionicons name="rocket" size={16} color="#fff" />
                    <Text style={styles.expoGoButtonText}>Paywall</Text>
                </TouchableOpacity>
            )}

            {/* Notifications Card */}
            {phoneNumber && (
                <View style={styles.notificationsCard}>
                    <View style={styles.notificationsHeader}>
                        <Ionicons name="notifications" size={20} color={Colors.primary} />
                        <Text style={styles.notificationsTitle}>
                            {t("home.notifications", "New Activity")}
                        </Text>
                    </View>
                    {notificationsLoading ? (
                        <View style={styles.notificationsContent}>
                            <SkeletonBar width="100%" height={40} />
                        </View>
                    ) : (
                        <View style={styles.notificationsContent}>
                            <View style={styles.notificationItem}>
                                <View style={styles.notificationIconContainer}>
                                    <LinearGradient
                                        colors={["#3B82F6", "#60A5FA"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.notificationIconGradient}
                                    >
                                        <Ionicons name="call" size={16} color="#fff" />
                                    </LinearGradient>
                                </View>
                                <View style={styles.notificationInfo}>
                                    <Text style={styles.notificationCount}>
                                        {notificationsResp?.newCalls ?? 0}
                                    </Text>
                                    <Text style={styles.notificationLabel}>
                                        {t("home.newCalls", "New Calls")}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.notificationDivider} />
                            <View style={styles.notificationItem}>
                                <View style={styles.notificationIconContainer}>
                                    <LinearGradient
                                        colors={["#10B981", "#34D399"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.notificationIconGradient}
                                    >
                                        <Ionicons name="calendar" size={16} color="#fff" />
                                    </LinearGradient>
                                </View>
                                <View style={styles.notificationInfo}>
                                    <Text style={styles.notificationCount}>
                                        {notificationsResp?.newAppointments ?? 0}
                                    </Text>
                                    <Text style={styles.notificationLabel}>
                                        {t("home.upcomingAppointments", "Upcoming")}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            )}
      {/* Agent Card
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
            {phoneNumber && (
              <Text style={styles.agentNumber}>
                {t("home.number", "Number")}: {phoneNumber}
              </Text>
            )}
            {!phoneNumber && (
              <Text style={styles.agentNumberMissing}>
                {t("home.noNumber", "No number assigned")}
              </Text>
            )}
          </View>
          <Ionicons name="settings-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View> */}

      {/* Stats Container - Only show if phone number exists
      {phoneNumber && (
        <View style={styles.statsContainer}>
          {statsLoading ? (
            <>
              <View style={styles.statCard}>
                <SkeletonBar width={60} height={16} />
                <SkeletonBar width={40} height={12} />
              </View>
              <View style={styles.statCard}>
                <SkeletonBar width={60} height={16} />
                <SkeletonBar width={40} height={12} />
              </View>
              <View style={styles.statCard}>
                <SkeletonBar width={60} height={16} />
                <SkeletonBar width={40} height={12} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.statCard}>
                <View style={styles.statRow}>
                  <Ionicons
                    name="call"
                    size={18}
                    color={Colors.primary}
                    style={styles.statIconInline}
                  />
                  <Text style={styles.statValue}>{stats.totalCalls}</Text>
                </View>
                <Text style={styles.statLabel}>
                  {t("home.totalCalls", "Total Calls")}
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statRow}>
                  <Ionicons
                    name="time"
                    size={18}
                    color={Colors.success}
                    style={styles.statIconInline}
                  />
                  <Text style={styles.statValue}>{stats.ongoingCalls}</Text>
                </View>
                <Text style={styles.statLabel}>
                  {t("home.ongoingCalls", "Active Calls")}
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statRow}>
                  <Ionicons
                    name="trending-up"
                    size={18}
                    color={Colors.info}
                    style={styles.statIconInline}
                  />
                  <Text style={styles.statValue}>
                    {Math.round(stats.totalDurationMinutes)}m
                  </Text>
                </View>
                <Text style={styles.statLabel}>
                  {t("home.totalDuration", "Total Duration")}
                </Text>
              </View>
            </>
          )}
        </View>
      )} */}

            {/* Quick Actions - Only show if phone number exists */}
            {phoneNumber && (
                <>
                    {/* <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/(tabs)/phone")}
            >
              <Ionicons name="call" size={18} color={Colors.primary} />
              <Text style={styles.actionButtonText}>
                {t("home.makeCall", "Make Call")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/call-history")}
            >
              <Ionicons name="document-text" size={18} color={Colors.primary} />
              <Text style={styles.actionButtonText}>
                {t("home.viewLogs", "Call Logs")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/analytics")}
            >
              <Ionicons name="analytics" size={18} color={Colors.primary} />
              <Text style={styles.actionButtonText}>
                {t("home.analytics", "Analytics")}
              </Text>
            </TouchableOpacity>
          </View> */}

                    {/* Section Title with Filter */}
                    <View style={styles.callsListContainer}>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                callTypeFilter === "all" && styles.filterButtonActiveAll,
                            ]}
                            onPress={() => setCallTypeFilter("all")}
                        >
                            <Ionicons
                                name="swap-vertical"
                                size={14}
                                color={
                                    callTypeFilter === "all"
                                        ? Colors.primary
                                        : Colors.textSecondary
                                }
                                style={styles.filterIcon}
                            />
                            <Text
                                style={[
                                    styles.filterButtonText,
                                    callTypeFilter === "all" && styles.filterButtonTextActiveAll,
                                ]}
                            >
                                {t("home.filterAll", "All")}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                callTypeFilter === "inbound" &&
                                    styles.filterButtonActiveInbound,
                            ]}
                            onPress={() => setCallTypeFilter("inbound")}
                        >
                            <SimpleLineIcons
                                name="call-in"
                                size={14}
                                color={
                                    callTypeFilter === "inbound"
                                        ? "#10B981"
                                        : Colors.textSecondary
                                }
                                style={styles.filterIcon}
                            />
                            <Text
                                style={[
                                    styles.filterButtonText,
                                    callTypeFilter === "inbound" &&
                                        styles.filterButtonTextActiveInbound,
                                ]}
                            >
                                {t("home.filterInbound", "Inbound")}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.filterButton,
                                callTypeFilter === "outbound" &&
                                    styles.filterButtonActiveOutbound,
                            ]}
                            onPress={() => setCallTypeFilter("outbound")}
                        >
                            <SimpleLineIcons
                                name="call-out"
                                size={14}
                                color={
                                    callTypeFilter === "outbound"
                                        ? "#3B82F6"
                                        : Colors.textSecondary
                                }
                                style={styles.filterIcon}
                            />
                            <Text
                                style={[
                                    styles.filterButtonText,
                                    callTypeFilter === "outbound" &&
                                        styles.filterButtonTextActiveOutbound,
                                ]}
                            >
                                {t("home.filterOutbound", "Outbound")}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Ionicons
                            name="search"
                            size={18}
                            color={Colors.textLight}
                            style={styles.searchIcon}
                        />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t("home.searchCalls", "Search calls...")}
                            placeholderTextColor={Colors.textLight}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <Ionicons
                                    name="close-circle"
                                    size={18}
                                    color={Colors.textLight}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </>
            )}
        </>
    );

    // Loading state - wait for both agent config and phone number
    if (isLoadingAgent || isLoadingPhone || !agentConfig) {
        return (
            <View style={styles.container}>
                <ListHeaderComponent />
                <View
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                >
                    <Text style={{ color: Colors.textSecondary }}>
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
                <ListHeaderComponent />
                <NoPhoneNumber variant="detailed" translationPrefix="home" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ListHeaderComponent />
            <View style={styles.callsListWrapper}>
                {callsLoading ? (
                    <View style={styles.callsListCard}>
                        {[...Array(5)].map((_, idx) => (
                            <View
                                key={idx}
                                style={{
                                    padding: 10,
                                    borderBottomWidth: 1,
                                    borderBottomColor: Colors.borderLight,
                                }}
                            >
                                <SkeletonBar width={"60%"} height={12} />
                                <SkeletonBar width={"40%"} height={10} />
                            </View>
                        ))}
                    </View>
                ) : callSections.length === 0 ? (
                    <View style={styles.callsListCard}>
                        <View style={styles.emptyCallsContainer}>
                            <View style={styles.emptyCallsIconContainer}>
                                <Ionicons
                                    name="call-outline"
                                    size={48}
                                    color={Colors.textLight}
                                />
                            </View>
                            <Text style={styles.emptyCallsTitle}>
                                {t("home.noCallsYet", "No Calls Yet")}
                            </Text>
                            <Text style={styles.emptyCallsSubtitle}>
                                {t(
                                    "home.noCallsDescription",
                                    "Your recent calls will appear here once you start making or receiving calls."
                                )}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.callsListCard}>
                        <SectionList
                            sections={callSections}
                            renderItem={renderCallItem}
                            renderSectionHeader={renderSectionHeader}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            style={styles.callsList}
                            stickySectionHeadersEnabled={false}
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    callsListWrapper: {
        flex: 1,
        marginBottom: 20,
    },
    callsListCard: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: 0,
        marginHorizontal: 0,
        paddingVertical: 0,
        paddingHorizontal: 0,
        shadowColor: "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        borderWidth: 0,
        borderColor: "transparent",
    },
    header: {
        padding: 24,
        paddingTop: 16,
        backgroundColor: Colors.background,
    },
    headerTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },
    headerTitle: {
        flex: 1,
        fontSize: 28,
        fontWeight: "bold",
        color: Colors.textPrimary,
        wordWrap: "break-word",
        marginBottom: 4,
    },
    expoGoButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        shadowColor: Colors.shadowOrange,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    expoGoButtonText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "bold",
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        fontWeight: "500",
    },
    notificationsCard: {
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
    notificationsHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
    },
    notificationsTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.textPrimary,
    },
    notificationsContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
    },
    notificationItem: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    notificationIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        overflow: "hidden",
    },
    notificationIconGradient: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    notificationInfo: {
        flex: 1,
    },
    notificationCount: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    notificationLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: "500",
    },
    notificationDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.borderLight,
        marginHorizontal: 16,
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
    agentNumber: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    agentNumberMissing: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
        fontStyle: "italic",
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
        padding: 12,
        alignItems: "center",
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    statRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    statIconInline: {
        marginRight: 6,
    },
    statValue: {
        fontSize: 22,
        fontWeight: "bold",
        color: Colors.textPrimary,
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
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 12,
        gap: 8,
    },
    searchContainer: {
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
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.textPrimary,
        padding: 0,
    },
    filterButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        backgroundColor: "transparent",
    },
    filterIcon: {
        marginRight: 6,
    },
    filterButtonActiveAll: {
        backgroundColor: Colors.primaryTransparent,
    },
    filterButtonActiveInbound: {
        backgroundColor: "#10B98120",
    },
    filterButtonActiveOutbound: {
        backgroundColor: "#3B82F620",
    },
    filterButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.textSecondary,
    },
    filterButtonTextActiveAll: {
        color: Colors.primary,
    },
    filterButtonTextActiveInbound: {
        color: "#10B981",
    },
    filterButtonTextActiveOutbound: {
        color: "#3B82F6",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.textPrimary,
    },
    callsList: {
        flex: 1,
        backgroundColor: "transparent",
        paddingBottom: 20,
    },
    callItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        marginHorizontal: 20,
        marginVertical: 6,
        backgroundColor: "#fff",
        borderRadius: 12,
    },
    callAvatarContainer: {
        position: "relative",
        marginRight: 12,
    },
    callAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.backgroundLight,
        alignItems: "center",
        justifyContent: "center",
    },
    callDirectionBadge: {
        position: "absolute",
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#fff",
    },
    callInfo: {
        flex: 1,
    },
    callNumberRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 2,
    },
    callDirectionLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.textSecondary,
        marginRight: 4,
    },
    callNumber: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.textPrimary,
    },
    callDate: {
        fontSize: 12,
        color: Colors.textLight,
    },
    callTime: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    callDuration: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginRight: 8,
        fontWeight: "500",
    },
    sectionHeader: {
        backgroundColor: Colors.background,
        paddingHorizontal: 20,
        paddingVertical: 8,
        marginTop: 8,
    },
    sectionHeaderText: {
        fontSize: 14,
        fontWeight: "bold",
        color: Colors.textSecondary,
    },
    emptyCallsContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyCallsIconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.backgroundLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        borderWidth: 2,
        borderColor: Colors.borderLight,
    },
    emptyCallsTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.textPrimary,
        marginBottom: 8,
        textAlign: "center",
    },
    emptyCallsSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
    },
});
