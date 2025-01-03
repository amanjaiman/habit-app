import { format, startOfWeek, addDays, parseISO, isSameDay } from "date-fns";
import { DEFAULT_CATEGORIES, Habit, HabitType } from "../../types/habit";
import { habitApi, useHabits } from "../../contexts/HabitContext";
import { useUser } from "../../contexts/UserContext";
import { FireIcon } from "@heroicons/react/24/solid";
import { calculateStreak } from "../../utils/helpers";
import React, { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useHabitDisplay } from "../../contexts/HabitDisplayContext";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  GroupHabit,
  GroupHabitCompletion,
  useGroups,
} from "../../contexts/GroupContext";
import { groupApi } from "../../contexts/GroupContext";
import { Link } from "react-router-dom";
import HabitCompletionControl from "./HabitCompletionControl";
import { getCompletionIcon } from "../../utils/habitUtils";

interface WeekViewProps {
  startDate: string; // ISO date string
  habits: Habit[];
}

export default function WeekView({ startDate, habits }: WeekViewProps) {
  const { dispatch } = useHabits();
  const { state: userState } = useUser();
  const { theme } = useTheme();
  const { groupHabits } = useHabitDisplay();
  const weekStart = startOfWeek(parseISO(startDate), { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );
  const { state: groupState, dispatch: groupDispatch } = useGroups();
  const [groupHabitsCollapsed, setGroupHabitsCollapsed] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | undefined>();
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedGroupHabit, setSelectedGroupHabit] = useState<
    (GroupHabit & { groupId: string }) | undefined
  >();
  const [isGroupCompletionDialogOpen, setIsGroupCompletionDialogOpen] =
    useState(false);
  const [selectedGroupDate, setSelectedGroupDate] = useState<Date | null>(null);

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleHabit = async (habitId: string, date: Date) => {
    if (!userState.profile?.id) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    if (habit.type === HabitType.BOOLEAN) {
      const isCompleted = habit.completions[dateStr] ?? false;
      try {
        await habitApi.toggle(
          userState.profile.id,
          habitId,
          dateStr,
          !isCompleted
        );
        dispatch({
          type: "TOGGLE_COMPLETION",
          payload: {
            habitId,
            date: dateStr,
            completed: !isCompleted,
          },
        });
      } catch (error) {
        console.error("Failed to toggle habit:", error);
      }
    } else {
      setSelectedHabit(habit);
      setSelectedDate(date);
      setIsCompletionDialogOpen(true);
    }
  };

  const handleCompletionSubmit = async (value: number) => {
    if (selectedHabit && selectedDate && userState.profile?.id) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      try {
        await habitApi.toggle(
          userState.profile.id,
          selectedHabit.id,
          dateStr,
          value
        );
        dispatch({
          type: "TOGGLE_COMPLETION",
          payload: {
            habitId: selectedHabit.id,
            date: dateStr,
            completed: value,
          },
        });
      } catch (error) {
        console.error("Failed to toggle habit:", error);
      }
      setIsCompletionDialogOpen(false);
      setSelectedHabit(undefined);
      setSelectedDate(null);
    }
  };

  const isHabitCompletedForWeek = (habit: Habit) => {
    return weekDays.every((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      return habit.completions[dateStr] ?? false;
    });
  };

  const groupedHabits = habits.reduce((acc, habit) => {
    const categoryId = habit.category || "uncategorized";
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(habit);
    return acc;
  }, {} as Record<string, Habit[]>);

  const getAllGroupHabits = () => {
    return groupState.groups.flatMap((group) =>
      group.habits.map((habit) => ({
        ...habit,
        groupId: group.id,
        groupName: group.name,
        groupEmoji: group.emoji,
      }))
    );
  };

  const calculateGroupHabitStreak = (
    completions: GroupHabitCompletion[],
    userId: string
  ) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);
    const todayStr = format(today, "yyyy-MM-dd");

    while (true) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const completion = completions.find(
        (c) => c.userId === userId && c.date === dateStr
      );

      // Skip today when calculating streak if there's no completion
      if (dateStr !== todayStr && (!completion || !completion.completed)) break;

      if (completion && completion.completed) {
        streak++;
      }

      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

  const toggleGroupHabit = async (
    groupId: string,
    habitId: string,
    date: Date,
    value: boolean | number
  ) => {
    if (!userState.profile?.id) return;

    const dateStr = format(date, "yyyy-MM-dd");
    try {
      await groupApi.toggleHabit(
        groupId,
        habitId,
        dateStr,
        value,
        userState.profile.id
      );
      groupDispatch({
        type: "TOGGLE_HABIT_COMPLETION",
        payload: {
          groupId,
          habitId,
          completion: {
            userId: userState.profile.id,
            date: dateStr,
            completed: value,
          },
        },
      });
    } catch (error) {
      console.error("Failed to toggle group habit:", error);
    }
  };

  const handleGroupHabitClick = (
    groupId: string,
    habit: GroupHabit,
    date: Date
  ) => {
    if (habit.type === HabitType.BOOLEAN) {
      const dateStr = format(date, "yyyy-MM-dd");
      const isCompleted = habit.completions.some(
        (c) => c.userId === userState.profile?.id && c.date === dateStr
      );
      toggleGroupHabit(groupId, habit.id, date, !isCompleted);
    } else if (
      habit.type === HabitType.NUMERIC ||
      habit.type === HabitType.RATING
    ) {
      setSelectedGroupHabit({ ...habit, groupId });
      setSelectedGroupDate(date);
      setIsGroupCompletionDialogOpen(true);
    }
  };

  const handleGroupCompletionSubmit = (value: number) => {
    if (selectedGroupHabit && selectedGroupDate) {
      toggleGroupHabit(
        selectedGroupHabit.groupId,
        selectedGroupHabit.id,
        selectedGroupDate,
        value
      );
      setIsGroupCompletionDialogOpen(false);
      setSelectedGroupHabit(undefined);
      setSelectedGroupDate(null);
    }
  };

  return (
    <div className="overflow-x-auto p-4 sm:p-6">
      <table
        className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50 
                        backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl 
                        shadow-xl border border-white/20 dark:border-gray-800/30 overflow-hidden"
      >
        <thead>
          <tr>
            <th className="px-6 py-4 text-left w-96 max-w-96">
              <span
                className="text-sm font-medium bg-gradient-to-r from-purple-600 
                              to-pink-600 dark:from-purple-400 dark:to-pink-400 
                              text-transparent bg-clip-text uppercase"
              >
                Habit
              </span>
            </th>
            {weekDays.map((day) => (
              <th key={day.toString()} className="px-6 py-4 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {format(day, "EEE")}
                  </span>
                  <span
                    className="mt-1 text-2xl font-bold bg-gradient-to-br 
                                 from-purple-600 to-pink-600 dark:from-purple-400 
                                 dark:to-pink-400 text-transparent bg-clip-text"
                  >
                    {format(day, "d")}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
          {groupHabits
            ? Object.entries(groupedHabits).map(
                ([categoryId, categoryHabits]) => {
                  const category = DEFAULT_CATEGORIES.find(
                    (c) => c.id === categoryId
                  ) || {
                    id: "uncategorized",
                    name: "Other",
                    color: "#6B7280",
                    darkColor: "#9CA3AF",
                  };

                  return (
                    <React.Fragment key={categoryId}>
                      <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                        <td colSpan={8} className="px-6 py-2">
                          <button
                            onClick={() => toggleCategory(categoryId)}
                            className="flex items-center space-x-2 w-full"
                          >
                            <ChevronDownIcon
                              className={`w-4 h-4 transition-transform duration-200 ${
                                collapsedCategories.has(categoryId)
                                  ? "-rotate-90"
                                  : ""
                              }`}
                              style={{
                                color:
                                  theme === "dark"
                                    ? category.darkColor
                                    : category.color,
                              }}
                            />
                            <span
                              className="text-sm font-medium"
                              style={{
                                color:
                                  theme === "dark"
                                    ? category.darkColor
                                    : category.color,
                              }}
                            >
                              {category.name}
                            </span>
                          </button>
                        </td>
                      </tr>

                      {!collapsedCategories.has(categoryId) &&
                        categoryHabits.map((habit) => {
                          const completedWeek = isHabitCompletedForWeek(habit);
                          const streak = calculateStreak(habit);

                          return (
                            <tr
                              key={habit.id}
                              className={`transition-all duration-300 ease-in-out
                                     ${
                                       completedWeek
                                         ? "bg-gradient-to-r from-green-100/75 to-emerald-100/75 dark:from-green-900/30 dark:to-emerald-900/30"
                                         : "hover:bg-white/50 dark:hover:bg-gray-800/50"
                                     }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap w-72 max-w-72">
                                <div className="flex items-center space-x-3">
                                  <span className="flex-shrink-0 text-xl">
                                    {habit.emoji}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-gray-900 dark:text-white truncate">
                                        {habit.name}
                                      </span>
                                      {streak > 0 && (
                                        <div className="flex-shrink-0 flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-orange-100/50 dark:bg-orange-900/30">
                                          <FireIcon className="w-3 h-3 text-orange-500" />
                                          <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                                            {streak}d
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              {weekDays.map((day) => {
                                const dateStr = format(day, "yyyy-MM-dd");
                                const value = habit.completions[dateStr];
                                const isToday = isSameDay(day, new Date());

                                return (
                                  <td
                                    key={day.toISOString()}
                                    className={`px-6 py-4 text-center ${
                                      isToday
                                        ? "bg-blue-100/40 dark:bg-blue-900/20"
                                        : ""
                                    }`}
                                  >
                                    <button
                                      onClick={() => toggleHabit(habit.id, day)}
                                      className="inline-flex items-center justify-center"
                                    >
                                      {getCompletionIcon(habit, value)}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                }
              )
            : habits.map((habit) => (
                <tr
                  key={habit.id}
                  className="hover:bg-white/50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap w-72 max-w-72">
                    <div className="flex items-center space-x-3">
                      <span className="flex-shrink-0 text-xl">
                        {habit.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {habit.name}
                          </span>
                          {calculateStreak(habit) > 0 && (
                            <div className="flex-shrink-0 flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-orange-100/50 dark:bg-orange-900/30">
                              <FireIcon className="w-3 h-3 text-orange-500" />
                              <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                                {calculateStreak(habit)}d
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const value = habit.completions[dateStr];
                    const isToday = isSameDay(day, new Date());

                    return (
                      <td
                        key={day.toISOString()}
                        className={`px-6 py-4 text-center ${
                          isToday ? "bg-blue-100/40 dark:bg-blue-900/20" : ""
                        }`}
                      >
                        <button
                          onClick={() => toggleHabit(habit.id, day)}
                          className="inline-flex items-center justify-center"
                        >
                          {getCompletionIcon(habit, value)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
          {getAllGroupHabits().length > 0 && (
            <>
              <tr className="bg-purple-50/50 dark:bg-purple-900/20">
                <td colSpan={8} className="px-6 py-2">
                  <button
                    onClick={() => setGroupHabitsCollapsed((prev) => !prev)}
                    className="flex items-center space-x-2 w-full"
                  >
                    <ChevronDownIcon
                      className={`w-4 h-4 transition-transform duration-200 text-purple-600 dark:text-purple-400 ${
                        groupHabitsCollapsed ? "-rotate-90" : ""
                      }`}
                    />
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Group Habits
                    </span>
                  </button>
                </td>
              </tr>

              {!groupHabitsCollapsed &&
                getAllGroupHabits().map((habit) => {
                  const streak = calculateGroupHabitStreak(
                    habit.completions,
                    userState.profile?.id || ""
                  );

                  return (
                    <tr
                      key={`${habit.groupId}-${habit.id}`}
                      className="hover:bg-white/50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap w-72 max-w-72">
                        <div className="flex items-center space-x-3">
                          <span className="flex-shrink-0 text-xl">
                            {habit.emoji}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {habit.name}
                              </span>
                              {streak > 0 && (
                                <div className="flex-shrink-0 flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-orange-100/50 dark:bg-orange-900/30">
                                  <FireIcon className="w-3 h-3 text-orange-500" />
                                  <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                                    {streak}d
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                <Link
                                  to={`/groups/${habit.groupId}`}
                                  className="hover:text-purple-600 dark:hover:text-purple-400"
                                >
                                  {habit.groupEmoji} {habit.groupName}
                                </Link>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const completionValue = habit.completions.find(
                          (c) =>
                            c.userId === userState.profile?.id &&
                            c.date === dateStr
                        )?.completed;
                        const isToday = isSameDay(day, new Date());

                        return (
                          <td
                            key={day.toISOString()}
                            className={`px-6 py-4 text-center ${
                              isToday
                                ? "bg-blue-100/40 dark:bg-blue-900/20"
                                : ""
                            }`}
                          >
                            <button
                              onClick={() =>
                                handleGroupHabitClick(habit.groupId, habit, day)
                              }
                              className="inline-flex items-center justify-center"
                            >
                              {getCompletionIcon(habit, completionValue)}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
            </>
          )}
        </tbody>
      </table>

      <HabitCompletionControl
        isOpen={isCompletionDialogOpen}
        onClose={() => {
          setIsCompletionDialogOpen(false);
          setSelectedHabit(undefined);
          setSelectedDate(null);
        }}
        habit={selectedHabit}
        value={
          selectedHabit && selectedDate
            ? selectedHabit.completions[format(selectedDate, "yyyy-MM-dd")] ?? 0
            : 0
        }
        onSubmit={handleCompletionSubmit}
      />

      <HabitCompletionControl
        isOpen={isGroupCompletionDialogOpen}
        onClose={() => {
          setIsGroupCompletionDialogOpen(false);
          setSelectedGroupHabit(undefined);
          setSelectedGroupDate(null);
        }}
        habit={selectedGroupHabit}
        value={
          selectedGroupHabit && selectedGroupDate
            ? (selectedGroupHabit.completions.find(
                (c) =>
                  c.userId === userState.profile?.id &&
                  c.date === format(selectedGroupDate, "yyyy-MM-dd")
              )?.completed as number) ?? 0
            : 0
        }
        onSubmit={handleGroupCompletionSubmit}
      />
    </div>
  );
}
