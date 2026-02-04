import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/utils/axios-interceptor";
import { useAgentQuery } from "@/app/hooks";
import type { RecentCallItem } from "@/app/utils/types";
import {
  formatDuration,
  formatDateTime,
  formatPhoneNumber,
} from "@/app/utils/formatters";
import { useContactLookup } from "./useContactLookup";

export type CallTypeFilter = "all" | "retell" | "twilio";
export type DirectionFilter = "all" | "inbound" | "outbound";

export interface UseCallHistoryReturn {
  // Agent
  agentDbId: string | null;

  // Filters
  callTypeFilter: CallTypeFilter;
  setCallTypeFilter: (filter: CallTypeFilter) => void;
  directionFilter: DirectionFilter;
  setDirectionFilter: (filter: DirectionFilter) => void;
  fromNumber: string;
  setFromNumber: (value: string) => void;
  toNumber: string;
  setToNumber: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;

  // Date Range
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;
  showStartPicker: boolean;
  setShowStartPicker: (show: boolean) => void;
  showEndPicker: boolean;
  setShowEndPicker: (show: boolean) => void;
  clearDates: () => void;

  // Pagination
  handleLoadMore: () => void;
  hasMore: boolean;

  // Data
  calls: RecentCallItem[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  handleApplyFilters: () => void;
}

export function useCallHistory(): UseCallHistoryReturn {
  const { i18n } = useTranslation();
  const { data: agentConfig } = useAgentQuery();
  const agentDbId = agentConfig?.id ?? null;

  // Device contact lookup for enriching phone numbers
  const { getContactName } = useContactLookup();

  // Filter states
  const [callTypeFilter, setCallTypeFilter] = useState<CallTypeFilter>("all");
  const [directionFilter, setDirectionFilter] =
    useState<DirectionFilter>("all");
  const [fromNumber, setFromNumber] = useState("");
  const [toNumber, setToNumber] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [paginationKey, setPaginationKey] = useState<string | null>(null);
  const [allCalls, setAllCalls] = useState<RecentCallItem[]>([]);

  // Date range states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const buildQueryParams = useCallback(
    (pagination?: string | null) => {
      let params = `agent_id=${encodeURIComponent(
        String(agentDbId),
      )}&limit=50&sort_order=descending`;

      if (callTypeFilter !== "all") {
        params += `&call_source=${callTypeFilter}`;
      }

      if (directionFilter !== "all") {
        params += `&direction=${directionFilter}`;
      }

      if (fromNumber.trim()) {
        params += `&from_number=${encodeURIComponent(fromNumber.trim())}`;
      }

      if (toNumber.trim()) {
        params += `&to_number=${encodeURIComponent(toNumber.trim())}`;
      }

      if (startDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        params += `&start_timestamp_after=${startOfDay.getTime()}`;
      }

      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        params += `&start_timestamp_before=${endOfDay.getTime()}`;
      }

      if (pagination) {
        params += `&pagination_key=${pagination}`;
      }

      return params;
    },
    [
      agentDbId,
      callTypeFilter,
      directionFilter,
      fromNumber,
      toNumber,
      startDate,
      endDate,
    ],
  );

  const {
    data: callsResp,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "call-history",
      agentDbId,
      callTypeFilter,
      directionFilter,
      fromNumber,
      toNumber,
      startDate,
      endDate,
      paginationKey,
    ],
    enabled: !!agentDbId,
    queryFn: async () => {
      const response = await apiClient.get(
        `calls/?${buildQueryParams(paginationKey)}`,
      );
      return response;
    },
  });

  // Transform raw calls data with device contact enrichment
  const newCalls = useMemo<RecentCallItem[]>(() => {
    const rawCalls: any[] = callsResp?.calls ?? [];
    return rawCalls.map((c: any) => {
      const direction = c?.direction;
      const number =
        direction === "inbound"
          ? formatPhoneNumber(c?.from_number)
          : formatPhoneNumber(c?.to_number);

      // Enrich with device contact names (prefer device contacts over backend)
      const fromContactName =
        getContactName(c?.from_number) ?? c?.from_contact_name ?? null;
      const toContactName =
        getContactName(c?.to_number) ?? c?.to_contact_name ?? null;

      return {
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
    });
  }, [callsResp, i18n.language, getContactName]);

  // Update allCalls when new data arrives
  useEffect(() => {
    if (paginationKey && newCalls.length > 0) {
      setAllCalls((prev) => [...prev, ...newCalls]);
    } else if (!paginationKey) {
      setAllCalls(newCalls);
    }
  }, [newCalls, paginationKey]);

  const handleLoadMore = useCallback(() => {
    const lastCallId = callsResp?.pagination_key;
    if (lastCallId) {
      setPaginationKey(lastCallId);
    }
  }, [callsResp?.pagination_key]);

  const handleApplyFilters = useCallback(() => {
    setPaginationKey(null);
  }, []);

  const clearDates = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
  }, []);

  return {
    agentDbId,
    callTypeFilter,
    setCallTypeFilter,
    directionFilter,
    setDirectionFilter,
    fromNumber,
    setFromNumber,
    toNumber,
    setToNumber,
    showFilters,
    setShowFilters,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    showStartPicker,
    setShowStartPicker,
    showEndPicker,
    setShowEndPicker,
    clearDates,
    handleLoadMore,
    hasMore: !!callsResp?.pagination_key,
    calls: allCalls,
    isLoading,
    error: error as Error | null,
    handleApplyFilters,
  };
}
