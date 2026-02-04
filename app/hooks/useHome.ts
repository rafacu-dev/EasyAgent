/**
 * useHome Hook
 *
 * Manages all home screen state and logic:
 * - Recent calls with filtering
 * - Notifications (new calls, appointments)
 * - Pull to refresh
 * - App update checking
 * - Device contact enrichment for phone numbers
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Platform, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/utils/axios-interceptor";
import { useAgentQuery, useAgentPhoneNumber } from "@/app/hooks";
import { getLastLogin } from "@/app/utils/storage";
import { getConfig } from "@/app/utils/services";
import { showWarning } from "@/app/utils/toast";
import {
  formatDuration,
  formatDateWithWeekday,
  formatPhoneNumber,
  formatDateTime,
} from "@/app/utils/formatters";
import type { RecentCallItem } from "@/app/utils/types";
import { useContactLookup } from "./useContactLookup";

export type CallTypeFilter = "all" | "inbound" | "outbound";

export interface CallSection {
  title: string;
  data: RecentCallItem[];
}

export interface NotificationsData {
  newCalls: number;
  newAppointments: number;
}

export interface UseHomeReturn {
  // Loading states
  isLoadingAgent: boolean;
  isLoadingPhone: boolean;
  isLoadingCalls: boolean;
  isLoadingNotifications: boolean;

  // Data
  agentConfig: any;
  phoneNumber: string | null;
  callSections: CallSection[];
  notifications: NotificationsData | null;
  error: string | undefined;

  // Filter
  callTypeFilter: CallTypeFilter;
  setCallTypeFilter: (filter: CallTypeFilter) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Refresh
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

export const useHome = (): UseHomeReturn => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  // Agent and phone number
  const { data: agentConfig, isLoading: isLoadingAgent } = useAgentQuery();
  const { phoneNumber, isLoading: isLoadingPhone } = useAgentPhoneNumber(
    agentConfig?.id,
  );

  // Device contact lookup for enriching phone numbers
  const { getContactName } = useContactLookup();

  // State
  const [callTypeFilter, setCallTypeFilter] = useState<CallTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const agentDbId = agentConfig?.id ?? null;

  // Recent calls query
  const {
    data: callsResp,
    isLoading: isLoadingCalls,
    error: callsErr,
  } = useQuery({
    queryKey: ["recent-calls", agentDbId, callTypeFilter],
    enabled: !!agentDbId,
    queryFn: () => {
      const directionParam =
        callTypeFilter === "all" ? "" : `&direction=${callTypeFilter}`;
      return apiClient.get(
        `calls/?agent_id=${encodeURIComponent(
          String(agentDbId),
        )}&limit=10&sort_order=descending${directionParam}`,
      );
    },
  });

  // Notifications query
  const { data: notificationsResp, isLoading: isLoadingNotifications } =
    useQuery({
      queryKey: ["notifications", agentDbId],
      enabled: !!agentDbId,
      queryFn: async () => {
        const lastLogin = await getLastLogin();
        const lastLoginParam = lastLogin
          ? `?after_datetime=${encodeURIComponent(lastLogin)}`
          : "";

        const [callsData, appointmentsData] = await Promise.all([
          apiClient.get(
            `calls/?agent_id=${encodeURIComponent(
              String(agentDbId),
            )}&limit=5&sort_order=descending${
              lastLogin
                ? `&after_datetime=${encodeURIComponent(lastLogin)}`
                : ""
            }`,
          ),
          apiClient.get(`appointments/${lastLoginParam}`),
        ]);

        return {
          newCalls: callsData?.calls?.length ?? 0,
          newAppointments: appointmentsData?.data?.length ?? 0,
        };
      },
    });

  // Process calls into sections
  const callSections = useMemo(() => {
    const rawCalls: any[] = callsResp?.calls ?? [];
    const callsByDay: CallSection[] = [];

    rawCalls.forEach((c: any) => {
      // Skip calls with invalid duration or timestamp
      if (
        c?.duration_ms == null ||
        isNaN(c?.duration_ms) ||
        !c?.start_timestamp ||
        c?.start_timestamp === 0
      ) {
        return;
      }

      const direction = c?.direction;
      const number =
        direction === "inbound"
          ? formatPhoneNumber(c?.from_number)
          : formatPhoneNumber(c?.to_number);
      const timestamp = c?.start_timestamp || 0;
      const dateTitle = `${formatDateWithWeekday(timestamp, i18n.language)}`;

      // Enrich with device contact names (prefer device contacts over backend)
      const fromContactName =
        getContactName(c?.from_number) ?? c?.from_contact_name ?? null;
      const toContactName =
        getContactName(c?.to_number) ?? c?.to_contact_name ?? null;

      const call: RecentCallItem = {
        id: c?.call_id ?? `${c?.start_timestamp ?? Math.random()}`,
        number: number ?? "Unknown",
        duration: formatDuration(c?.duration_ms ?? c?.duration ?? 0),
        date: c?.start_timestamp
          ? formatDateTime(new Date(c.start_timestamp).getTime(), i18n.language)
          : "",
        status: c?.call_status ?? "",
        direction: direction ?? "unknown",
        fromNumber: formatPhoneNumber(c?.from_number) ?? "Unknown",
        toNumber: formatPhoneNumber(c?.to_number) ?? "Unknown",
        fromContactName,
        toContactName,
        callType: c?.call_type ?? "",
        callSource: c?.call_source ?? "unknown",
      };

      if (!callsByDay.find((day) => day.title === dateTitle)) {
        callsByDay.push({ title: dateTitle, data: [] });
      }
      const day = callsByDay.find((day) => day.title === dateTitle);
      day?.data.push(call);
    });

    return callsByDay;
  }, [callsResp?.calls, i18n.language, getContactName]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["recent-calls"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const NotificationService = (
          await import("../notifications/NotificationService")
        ).default;
        const notificationService = NotificationService.getInstance();

        await notificationService.initialize();

        const authToken = await AsyncStorage.getItem("authToken");
        if (!authToken) {
          console.log("⚠️ User not authenticated yet, will retry after login");
          return;
        }

        const token = await notificationService.requestPermissionsAndRegister();
        if (token) {
          console.log("✅ Notification token obtained:", token);
          const success = await notificationService.sendTokenToServer();
          if (success) {
            console.log("✅ Token successfully registered with backend");
          } else {
            console.log("⚠️ Failed to register token with backend, will retry");
            setTimeout(async () => {
              await notificationService.sendTokenToServer();
            }, 3000);
          }
        }
      } catch (notifError) {
        console.error("Error initializing notifications:", notifError);
      }
    };

    initializeNotifications();
  }, []);

  // Check for app updates
  useEffect(() => {
    const checkForUpdates = () => {
      const appVersion = parseFloat(Constants.expoConfig?.version || "0.0");

      getConfig()
        .then((response) => {
          const storeUrl =
            Platform.OS === "ios"
              ? response["update_url_ios"]
              : response["update_url_android"];
          if (appVersion < response["min_version"]) {
            showWarning(t("index.updateApp"), t("index.updateAppMsg"));
            setTimeout(() => {
              Linking.openURL(storeUrl);
            }, 2000);
          } else if (appVersion < response["current_version"]) {
            showWarning(
              t("index.updateAppAvailable"),
              t("index.updateAppMsgAvailable"),
            );
          }
        })
        .catch(() => {});
    };
    checkForUpdates();
  }, [t]);

  return {
    // Loading states
    isLoadingAgent,
    isLoadingPhone,
    isLoadingCalls,
    isLoadingNotifications,

    // Data
    agentConfig,
    phoneNumber: phoneNumber || null,
    callSections,
    notifications: notificationsResp || null,
    error: (callsErr as any)?.message,

    // Filter
    callTypeFilter,
    setCallTypeFilter,

    // Search
    searchQuery,
    setSearchQuery,

    // Refresh
    refreshing,
    onRefresh,
  };
};

export default useHome;
