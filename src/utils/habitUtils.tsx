import React from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import { MinusCircleIcon } from "@heroicons/react/24/solid";
import {
  Habit,
  HabitType,
  NumericHabitConfig,
  RatingHabitConfig,
} from "../types/habit";
import { GroupHabit } from "../contexts/GroupContext";

export function getCompletionIcon(
  habit: Habit | GroupHabit,
  value: boolean | number | undefined,
  showValue: boolean = false
) {
  if (habit.type === HabitType.BOOLEAN) {
    return value ? (
      <CheckCircleSolidIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 dark:text-green-400" />
    ) : (
      <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 dark:text-gray-600" />
    );
  }

  if (habit.type === HabitType.NUMERIC && typeof value === "number") {
    const config = habit.config as NumericHabitConfig;
    const progress = (value / config.goal) * 100;
    const isGoalReached = config.higherIsBetter
      ? value >= config.goal
      : value <= config.goal;

    return (
      <div className="flex flex-col items-center gap-0.5">
        {isGoalReached ? (
          <CheckCircleSolidIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 dark:text-green-400" />
        ) : progress >= 70 ? (
          <MinusCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 dark:text-yellow-400" />
        ) : (
          <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 dark:text-gray-600" />
        )}
        {showValue && (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {value}
          </span>
        )}
      </div>
    );
  }

  if (habit.type === HabitType.RATING && typeof value === "number") {
    const config = habit.config as RatingHabitConfig;
    const goal = config.goal;

    return (
      <div className="flex flex-col items-center gap-0.5">
        {value === goal ? (
          <CheckCircleSolidIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 dark:text-green-400" />
        ) : value === goal + 1 || value === goal - 1 ? (
          <MinusCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 dark:text-yellow-400" />
        ) : (
          <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 dark:text-gray-600" />
        )}
        {showValue && (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {value}
          </span>
        )}
      </div>
    );
  }

  return (
    <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 dark:text-gray-600" />
  );
}
