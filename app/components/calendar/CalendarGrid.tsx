/**
 * CalendarGrid Component
 *
 * Monthly calendar view with appointment indicators
 */

import React, { memo, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/app/utils/colors";

interface CalendarGridProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onChangeMonth: (direction: number) => void;
  appointmentDates: string[];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const CalendarGrid = memo(function CalendarGrid({
  selectedDate,
  onSelectDate,
  onChangeMonth,
  appointmentDates,
}: CalendarGridProps) {
  const today = useMemo(() => new Date(), []);

  const daysInMonth = useMemo(
    () =>
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        0,
      ).getDate(),
    [selectedDate],
  );

  const firstDayOfMonth = useMemo(
    () =>
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay(),
    [selectedDate],
  );

  const renderDays = () => {
    const days = [];
    const currentDay = selectedDate.getDate();

    // Empty cells for days before the first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.day} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1,
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const hasAppointments = appointmentDates.includes(dateStr);

      const isToday =
        day === today.getDate() &&
        selectedDate.getMonth() === today.getMonth() &&
        selectedDate.getFullYear() === today.getFullYear();

      const isSelected = day === currentDay;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.day,
            isToday && styles.dayToday,
            isSelected && styles.daySelected,
          ]}
          onPress={() =>
            onSelectDate(
              new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                day,
              ),
            )
          }
        >
          <Text
            style={[
              styles.dayText,
              (isToday || isSelected) && styles.dayTextHighlight,
            ]}
          >
            {day}
          </Text>
          {hasAppointments && <View style={styles.appointmentDot} />}
        </TouchableOpacity>,
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      {/* Header with month navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onChangeMonth(-1)}
          style={styles.monthButton}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.secondary} />
        </TouchableOpacity>

        <Text style={styles.monthText}>
          {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </Text>

        <TouchableOpacity
          onPress={() => onChangeMonth(1)}
          style={styles.monthButton}
        >
          <Ionicons name="chevron-forward" size={24} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Week day headers */}
      <View style={styles.weekDays}>
        {WEEK_DAYS.map((day) => (
          <Text key={day} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>{renderDays()}</View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  weekDays: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  weekDay: {
    width: 40,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  day: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  dayToday: {
    backgroundColor: Colors.secondaryLight,
    borderRadius: 8,
  },
  daySelected: {
    backgroundColor: Colors.secondary,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  dayTextHighlight: {
    color: Colors.textWhite,
    fontWeight: "600",
  },
  appointmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 2,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
});

export default CalendarGrid;
