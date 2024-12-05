import { parseISO } from "date-fns";
import { HabitCompletions } from "../types/habit";

export function calculateStreak(completions: HabitCompletions) {
    // Convert completions object to array of dates and sort
    const completedDates = Object.entries(completions)
        .filter(([_, completed]) => completed)
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
    const diffFromToday = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));

    // If most recent completion is older than yesterday, streak is 0
    if (diffFromToday > 1) {
        return 0;
    }

    let currentStreak = 1; // Start with 1 for the most recent completion

    // Find streak by checking consecutive days
    for (let i = 1; i < completedDates.length; i++) {
        const currentDate = completedDates[i - 1];
        const nextDate = completedDates[i];
        const diffInDays = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 1) {
        currentStreak++;
        } else {
        break;
        }
    }

    return currentStreak;
}