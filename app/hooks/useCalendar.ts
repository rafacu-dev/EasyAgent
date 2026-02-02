/**
 * useCalendar Hook
 *
 * Manages all calendar-related state and logic:
 * - Monthly appointments fetch
 * - Date selection
 * - Appointment actions (confirm, cancel)
 * - Detail modal state
 */

import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, Href } from "expo-router";
import { apiClient } from "@/app/utils/axios-interceptor";
import { useAgentQuery, useAgentPhoneNumber } from "@/app/utils/hooks";
import { showError } from "@/app/utils/toast";
import type {
  Appointment,
  MonthResponse,
  AppointmentStatus,
} from "@/app/utils/types";

export const STATUS_COLORS: { [key in AppointmentStatus]: string } = {
  scheduled: "#3498db", // info color
  confirmed: "#27ae60", // success
  completed: "#7f8c8d", // text secondary
  cancelled: "#e74c3c", // error
  no_show: "#f39c12", // warning
  rescheduled: "#9b59b6",
};

export interface UseCalendarReturn {
  // Loading states
  isLoading: boolean;

  // Data
  phoneNumber: string | null;
  appointments: Appointment[];
  appointmentDates: string[];
  dayAppointments: Appointment[];

  // Date selection
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedDateStr: string;
  changeMonth: (direction: number) => void;

  // Detail modal
  showDetailModal: boolean;
  setShowDetailModal: (show: boolean) => void;
  selectedAppointment: Appointment | null;
  setSelectedAppointment: (appointment: Appointment | null) => void;
  openAppointmentDetail: (appointment: Appointment) => void;
  closeDetailModal: () => void;

  // Actions
  cancelAppointment: (id: number) => void;
  confirmAppointment: (id: number) => void;
  isCancelling: boolean;
  isConfirming: boolean;

  // Refresh
  refreshing: boolean;
  onRefresh: () => void;

  // Navigation
  goToCreateAppointment: () => void;

  // Helpers
  formatTime: (time: string) => string;
}

export const useCalendar = (): UseCalendarReturn => {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Agent and phone number
  const { data: agentConfig } = useAgentQuery();
  const { phoneNumber } = useAgentPhoneNumber(agentConfig?.id);

  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Computed selected date string
  const selectedDateStr = useMemo(
    () => selectedDate.toISOString().split("T")[0],
    [selectedDate],
  );

  // Fetch appointments for the month
  const { data: monthData, isLoading } = useQuery<MonthResponse>({
    queryKey: [
      "appointments-month",
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
    ],
    queryFn: async () => {
      const response = await apiClient.get(
        `appointments/month/?year=${selectedDate.getFullYear()}&month=${
          selectedDate.getMonth() + 1
        }`,
      );
      return response;
    },
    enabled: !!phoneNumber,
  });

  const appointments = useMemo<Appointment[]>(
    () => monthData?.data ?? [],
    [monthData?.data],
  );
  const appointmentDates: string[] = monthData?.appointment_dates ?? [];

  // Get appointments for selected date
  const dayAppointments = useMemo(
    () => appointments.filter((apt) => apt.date === selectedDateStr),
    [appointments, selectedDateStr],
  );

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`appointments/${id}/cancel/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments-month"] });
      setShowDetailModal(false);
    },
    onError: (error: any) => {
      showError(
        t("common.error", "Error"),
        error.response?.data?.error ||
          t("calendar.cancelFailed", "Failed to cancel appointment"),
      );
    },
  });

  // Confirm appointment mutation
  const confirmMutation = useMutation({
    mutationFn: (id: number) => apiClient.post(`appointments/${id}/confirm/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments-month"] });
      setShowDetailModal(false);
    },
    onError: (error: any) => {
      showError(
        t("common.error", "Error"),
        error.response?.data?.error ||
          t("calendar.confirmFailed", "Failed to confirm appointment"),
      );
    },
  });

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    queryClient
      .invalidateQueries({ queryKey: ["appointments-month"] })
      .finally(() => setRefreshing(false));
  }, [queryClient]);

  // Change month
  const changeMonth = useCallback(
    (direction: number) => {
      setSelectedDate(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + direction,
          1,
        ),
      );
    },
    [selectedDate],
  );

  // Open appointment detail
  const openAppointmentDetail = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  }, []);

  // Close detail modal
  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
  }, []);

  // Navigate to create appointment
  const goToCreateAppointment = useCallback(() => {
    router.push({
      pathname: "/create-appointment",
      params: { date: selectedDateStr },
    } as unknown as Href);
  }, [router, selectedDateStr]);

  // Format time helper
  const formatTime = useCallback((time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  }, []);

  return {
    // Loading states
    isLoading,

    // Data
    phoneNumber: phoneNumber || null,
    appointments,
    appointmentDates,
    dayAppointments,

    // Date selection
    selectedDate,
    setSelectedDate,
    selectedDateStr,
    changeMonth,

    // Detail modal
    showDetailModal,
    setShowDetailModal,
    selectedAppointment,
    setSelectedAppointment,
    openAppointmentDetail,
    closeDetailModal,

    // Actions
    cancelAppointment: cancelMutation.mutate,
    confirmAppointment: confirmMutation.mutate,
    isCancelling: cancelMutation.isPending,
    isConfirming: confirmMutation.isPending,

    // Refresh
    refreshing,
    onRefresh,

    // Navigation
    goToCreateAppointment,

    // Helpers
    formatTime,
  };
};

export default useCalendar;
