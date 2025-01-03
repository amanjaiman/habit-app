import { Group } from "../contexts/GroupContext";

export const calculateGroupStreak = (group: Group): number => {
  if (!group.habits.length || !group.memberDetails.length) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let checkDate = new Date(today);

  // Check backwards day by day
  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];

    // Check if all members completed all habits for this day
    const allCompletedForDay = group.habits.every((habit) =>
      group.memberDetails.every((member) => {
        // Check if this member completed this habit on this day
        const completedToday = habit.completions?.some(
          (completion) =>
            completion.userId === member.id &&
            completion.date.split("T")[0] === dateStr
        );
        return completedToday;
      })
    );

    // Break the streak if we find a day where not everyone completed their habits
    if (!allCompletedForDay) {
      break;
    }

    currentStreak++;

    // Move to previous day
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return currentStreak;
};

// Helper function to calculate individual member streaks
export const calculateMemberStreak = (
  memberId: string,
  group: Group
): number => {
  if (!group.habits.length) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let checkDate = new Date(today);

  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];

    // Check if member completed all habits for this day
    const allHabitsCompleted = group.habits.every((habit) =>
      habit.completions?.some(
        (completion) =>
          completion.userId === memberId &&
          completion.date.split("T")[0] === dateStr
      )
    );

    if (!allHabitsCompleted) {
      break;
    }

    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return currentStreak;
};

// Helper function to check if a specific date was completed
export const isDateCompleted = (
  date: Date,
  group: Group,
  memberId?: string
): boolean => {
  const dateStr = date.toISOString().split("T")[0];

  if (memberId) {
    // Check completion for specific member
    return group.habits.every((habit) =>
      habit.completions?.some(
        (completion) =>
          completion.userId === memberId &&
          completion.date.split("T")[0] === dateStr
      )
    );
  }

  // Check completion for all members
  return group.habits.every((habit) =>
    group.memberDetails.every((member) =>
      habit.completions?.some(
        (completion) =>
          completion.userId === member.id &&
          completion.date.split("T")[0] === dateStr
      )
    )
  );
};
