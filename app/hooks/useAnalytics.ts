import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/utils/axios-interceptor";
import { useAgentQuery } from "@/app/utils/hooks";

export interface AnalyticsStats {
  total_calls: number;
  inbound_calls: number;
  outbound_calls: number;
  ended_calls: number;
  ongoing_calls: number;
  total_duration_minutes: number;
  average_duration_minutes: number;
}

export interface UseAnalyticsReturn {
  agentDbId: string | null;
  agentName: string;
  date: string;
  stats: AnalyticsStats;
  callsByHour: Record<string, number>;
  maxHourlyValue: number;
  peakHour: string;
  inboundRate: number;
  completionRate: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAnalytics(): UseAnalyticsReturn {
  const { data: agentConfig } = useAgentQuery();
  const agentDbId = agentConfig?.id ?? null;

  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analytics", agentDbId],
    enabled: !!agentDbId,
    queryFn: () => apiClient.get(`agents/${agentDbId}/call-traffic/`),
  });

  const stats: AnalyticsStats = useMemo(
    () => ({
      total_calls: analyticsData?.statistics?.total_calls ?? 0,
      inbound_calls: analyticsData?.statistics?.inbound_calls ?? 0,
      outbound_calls: analyticsData?.statistics?.outbound_calls ?? 0,
      ended_calls: analyticsData?.statistics?.ended_calls ?? 0,
      ongoing_calls: analyticsData?.statistics?.ongoing_calls ?? 0,
      total_duration_minutes:
        analyticsData?.statistics?.total_duration_minutes ?? 0,
      average_duration_minutes:
        analyticsData?.statistics?.average_duration_minutes ?? 0,
    }),
    [analyticsData?.statistics],
  );

  const callsByHour: Record<string, number> = useMemo(
    () => analyticsData?.calls_by_hour ?? {},
    [analyticsData?.calls_by_hour],
  );

  const maxHourlyValue = useMemo(
    () => Math.max(...Object.values(callsByHour).map((v) => Number(v) || 0), 1),
    [callsByHour],
  );

  const peakHour = useMemo(() => {
    const entries = Object.entries(callsByHour);
    if (entries.length === 0) return "0";
    return entries.reduce(
      (max, [hour, count]) =>
        Number(count) > Number(callsByHour[max] || 0) ? hour : max,
      "0",
    );
  }, [callsByHour]);

  const inboundRate = useMemo(
    () =>
      stats.total_calls > 0
        ? Math.round((stats.inbound_calls / stats.total_calls) * 100)
        : 0,
    [stats.total_calls, stats.inbound_calls],
  );

  const completionRate = useMemo(
    () =>
      stats.total_calls > 0
        ? Math.round((stats.ended_calls / stats.total_calls) * 100)
        : 0,
    [stats.total_calls, stats.ended_calls],
  );

  return {
    agentDbId,
    agentName: analyticsData?.agent_name ?? "",
    date: analyticsData?.date ?? "",
    stats,
    callsByHour,
    maxHourlyValue,
    peakHour,
    inboundRate,
    completionRate,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
