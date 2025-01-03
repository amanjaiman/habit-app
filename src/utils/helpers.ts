import { parseISO } from "date-fns";
import {
  Habit,
  HabitCompletionValue,
  HabitType,
  NumericHabitConfig,
  RatingHabitConfig,
} from "../types/habit";
import { GroupHabit } from "../contexts/GroupContext";

export function isHabitCompletedForDay(
  habit: Habit | GroupHabit,
  value: HabitCompletionValue
): boolean {
  if (habit.type === HabitType.BOOLEAN) {
    return Boolean(value);
  }

  if (habit.type === HabitType.NUMERIC && typeof value === "number") {
    const config = habit.config as NumericHabitConfig;
    return config.higherIsBetter ? value >= config.goal : value <= config.goal;
  }

  if (habit.type === HabitType.RATING && typeof value === "number") {
    const config = habit.config as RatingHabitConfig;
    return value === config.goal;
  }

  return false;
}

export function calculateStreak(habit: Habit): number {
  // Convert completions object to array of dates and sort
  const completedDates = Object.entries(habit.completions)
    .filter(([_, value]) => isHabitCompletedForDay(habit, value))
    .map(([date]) => parseISO(date))
    .sort((a, b) => b.getTime() - a.getTime()); // Sort descending

  // If no completed dates, return 0
  if (completedDates.length === 0) {
    return 0;
  }

  // Check if most recent completion is today or yesterday
  const mostRecent = completedDates[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffFromToday = Math.floor(
    (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If most recent completion is older than yesterday, streak is 0
  if (diffFromToday > 1) {
    return 0;
  }

  let currentStreak = 1; // Start with 1 for the most recent completion

  // Find streak by checking consecutive days
  for (let i = 1; i < completedDates.length; i++) {
    const currentDate = completedDates[i - 1];
    const nextDate = completedDates[i];
    const diffInDays = Math.floor(
      (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  return currentStreak;
}
