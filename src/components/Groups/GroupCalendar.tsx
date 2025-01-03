import { useState } from "react";
import {
  Group,
  GroupHabit,
  GroupHabitCompletion,
} from "../../contexts/GroupContext";
import { format, startOfWeek, addDays } from "date-fns";
import {
  HabitType,
  NumericHabitConfig,
  RatingHabitConfig,
} from "../../types/habit";
import MemberAvatar from "../common/MemberAvatar";
import { FireIcon } from "@heroicons/react/24/solid";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";

interface GroupCalendarProps {
  group: Group;
}

interface GroupMember {
  id: string;
  name: string;
  profileImage?: string;
}

export default function GroupCalendar({ group }: GroupCalendarProps) {
  const [currentDate] = useState(new Date());
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfCurrentWeek, i)
  );

  return (
    <div className="space-y-4">
      <div className="mb-4 sm:mb-6">
        <h3
          className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                     dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
        >
          Weekly Progress
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
          Track your group's daily completions
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {group.habits.map((habit) => (
          <HabitWeekCard
            key={habit.id}
            habit={habit}
            weekDays={weekDays}
            members={group.memberDetails}
          />
        ))}
      </div>
    </div>
  );
}

function HabitWeekCard({
  habit,
  weekDays,
  members,
}: {
  habit: GroupHabit;
  weekDays: Date[];
  members: GroupMember[];
}) {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const streak = calculateStreak(habit, members.length);
  const today = format(new Date(), "yyyy-MM-dd");
  const todayCompletions = habit.completions.filter((c) => c.date === today);
  const completedToday = todayCompletions.filter((c) =>
    isHabitCompleted(habit, c.completed)
  ).length;

  return (
    <div
      className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-xl p-4 sm:p-6 
                    border border-white/20 dark:border-gray-800/30 shadow-lg 
                    transition-all duration-200 hover:shadow-xl space-y-3 sm:space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <span className="text-2xl sm:text-3xl">{habit.emoji}</span>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {habit.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <span>
                {completedToday} of {members.length} today
              </span>
              {streak > 0 && (
                <div
                  className="flex items-center space-x-1 px-2 py-0.5 
                              bg-orange-100 dark:bg-orange-900/30 rounded-full"
                >
                  <FireIcon className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                  <span className="text-orange-700 dark:text-orange-400">
                    {streak}d streak
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Week Progress */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((date) => (
          <DayCard
            key={format(date, "yyyy-MM-dd")}
            date={date}
            habit={habit}
            completions={habit.completions.filter(
              (c) => c.date === format(date, "yyyy-MM-dd")
            )}
            members={members}
            isSelected={format(date, "yyyy-MM-dd") === selectedDate}
            onSelect={() => setSelectedDate(format(date, "yyyy-MM-dd"))}
          />
        ))}
      </div>

      {/* Members Progress */}
      <div className="pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700/30">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {members.map((member) => {
            const completion = habit.completions.find(
              (c) => c.userId === member.id && c.date === selectedDate
            );
            const value = completion?.completed;
            const isCompleted = isHabitCompleted(habit, value || false);
            const isClose = isCloseToGoal(habit, value || false);

            return (
              <div
                key={member.id}
                className={`relative group transition-opacity duration-200 ${
                  completion ? "opacity-100" : "opacity-50 hover:opacity-75"
                }`}
              >
                <MemberAvatar member={member} size="sm" />
                {completion &&
                  (habit.type !== HabitType.BOOLEAN || value === true) && (
                    <div
                      className={`absolute -bottom-1 -right-1 
                    ${
                      habit.type === HabitType.BOOLEAN
                        ? "text-green-500"
                        : "text-xs font-medium px-1 rounded-full shadow-lg text-gray-900 dark:text-white"
                    } ${
                        isCompleted
                          ? habit.type === HabitType.BOOLEAN
                            ? "text-green-500"
                            : "bg-green-500 text-white"
                          : isClose
                          ? "bg-yellow-500 text-white"
                          : "bg-white dark:bg-gray-800"
                      }`}
                    >
                      {habit.type === HabitType.BOOLEAN ? (
                        <CheckCircleSolidIcon className="w-4 h-4" />
                      ) : (
                        value
                      )}
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayCard({
  date,
  habit,
  completions,
  members,
  isSelected,
  onSelect,
}: {
  date: Date;
  habit: GroupHabit;
  completions: GroupHabitCompletion[];
  members: GroupMember[];
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isToday =
    format(new Date(), "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
  const completedCompletions = completions.filter((c) =>
    isHabitCompleted(habit, c.completed)
  );
  const completedCount = completedCompletions.length;

  let displayValue = "";
  if (habit.type === HabitType.BOOLEAN) {
    displayValue = `${completedCount}/${members.length}`;
  } else {
    const values = completions
      .filter((c) => typeof c.completed === "number")
      .map((c) => c.completed as number);

    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      displayValue = avg % 1 === 0 ? avg.toString() : avg.toFixed(1);
    }
  }

  const progress = (completedCount / members.length) * 100;

  return (
    <div
      onClick={onSelect}
      className={`relative p-2 sm:p-3 rounded-lg transition-all duration-200 min-w-[40px] overflow-hidden
        cursor-pointer
        ${
          isToday
            ? "bg-purple-100 dark:bg-purple-900/30 ring-1 ring-inset ring-purple-500/50"
            : isSelected
            ? "bg-purple-50 dark:bg-purple-900/20 ring-1 ring-inset ring-purple-400/30"
            : "bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-700/50"
        }`}
    >
      <div className="text-center mb-1.5 sm:mb-2">
        <div className="text-[10px] sm:text-xs font-medium text-gray-900 dark:text-white">
          {format(date, "EEE")}
        </div>
        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          {format(date, "d")}
        </div>
      </div>

      <div className="h-1.5 sm:h-2 rounded-full bg-gray-200 dark:bg-gray-700/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500
                     transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-center text-gray-700 dark:text-gray-300 truncate">
        {displayValue}
      </div>
    </div>
  );
}

// Helper functions
function isHabitCompleted(habit: GroupHabit, value: boolean | number): boolean {
  if (habit.type === HabitType.BOOLEAN) {
    return value === true;
  }
  if (habit.type === HabitType.NUMERIC) {
    const config = habit.config as NumericHabitConfig;
    return (
      typeof value === "number" &&
      (config?.higherIsBetter ? value >= config.goal : value <= config.goal)
    );
  }
  if (habit.type === HabitType.RATING) {
    const config = habit.config as RatingHabitConfig;
    return typeof value === "number" && value === (config.goal || 5);
  }
  return false;
}

function isCloseToGoal(habit: GroupHabit, value: boolean | number): boolean {
  if (habit.type !== HabitType.RATING || typeof value !== "number") {
    return false;
  }
  const config = habit.config as RatingHabitConfig;
  return Math.abs(value - config.goal) === 1; // Within 1 point of the goal
}

function calculateStreak(habit: GroupHabit, totalMembers: number): number {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = format(addDays(today, -i), "yyyy-MM-dd");
    const completions = habit.completions.filter((c) => c.date === date);
    const completedCount = completions.filter((c) =>
      isHabitCompleted(habit, c.completed)
    ).length;

    if (completedCount >= totalMembers / 2) {
      streak++;
    } else break;
  }

  return streak;
}
