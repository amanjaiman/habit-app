import { format, parseISO } from 'date-fns';
import { DEFAULT_CATEGORIES, Habit, HabitCategory, HabitCompletions } from '../../types/habit';
import { habitApi, useHabits } from '../../contexts/HabitContext';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { useUser } from '../../contexts/UserContext';
import { FireIcon } from '@heroicons/react/24/solid';
import { useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { calculateStreak } from '../../utils/helpers';

interface DayViewProps {
  date: string; // ISO date string
  habits: Habit[];
}

export default function DayView({ date, habits }: DayViewProps) {
  const { dispatch } = useHabits();
  const { state: userState } = useUser();
  const { theme } = useTheme();
  const formattedDate = format(parseISO(date), 'EEEE, MMMM d');

  const toggleHabit = async (habitId: string) => {
    if (!userState.profile?.id) return;

    const habit = habits.find(h => h.id === habitId);
    const isCompleted = habit?.completions[date] ?? false;

    try {
      await habitApi.toggle(userState.profile.id, habitId, date, !isCompleted);
      dispatch({
        type: 'TOGGLE_COMPLETION',
        payload: {
          habitId,
          date,
          completed: !isCompleted,
        },
      });
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    }
  };

  const completedCount = habits.filter(habit => habit.completions[date]).length;
  const allCompleted = completedCount === habits.length && habits.length > 0;

  const formatCategory = useCallback((categoryId: string) => {
    const category = DEFAULT_CATEGORIES.find((c: HabitCategory) => c.id === categoryId);
    return (
      <span className="text-xs font-medium" style={{ color: theme === 'dark' ? category?.darkColor : category?.color }}>
        {category?.name}
      </span>
    );
  }, []);

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                       dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
          {formattedDate}
        </h3>
        <div className="flex items-center gap-2">
          {allCompleted && (
            <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 
                           px-2 py-0.5 rounded-full">
              <SparklesIcon className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
                All Complete!
              </span>
            </div>
          )}
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 
                          bg-white/50 dark:bg-gray-800/50 px-3 py-1 rounded-full">
            {completedCount} of {habits.length} completed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 gap-4">
        {habits.map((habit) => {
          const isCompleted = habit.completions[date] ?? false;
          const streak = calculateStreak(habit.completions);

          return (
            <div
              key={habit.id}
              className={`rounded-xl transition-all duration-200 overflow-hidden
                         border border-white/20 dark:border-gray-800/30
                         ${isCompleted 
                           ? 'bg-green-100/50 dark:bg-green-900/20' 
                           : 'bg-white/30 dark:bg-gray-900/30'
                         }`}
            >
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{habit.emoji}</span>
                    <div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-2">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                          {habit.name}
                        </h4>
                        {streak > 0 && (
                          <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-orange-100/50 dark:bg-orange-900/30">
                            <FireIcon className="w-3 h-3 text-orange-500" />
                            <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                              {streak}d
                            </span>
                          </div>
                        )}
                      </div>
                      {habit.category && (
                        <div>
                          {formatCategory(habit.category)}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleHabit(habit.id)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md
                               transition-all duration-200
                               ${isCompleted 
                                 ? 'bg-green-200/50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                 : 'bg-gray-200/50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                               } hover:opacity-80`}
                  >
                    {isCompleted ? (
                      <div className="flex items-center space-x-1.5">
                        <CheckCircleSolidIcon className="w-5 h-5" />
                        <div className="text-xs font-medium hidden sm:flex">
                          Done
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        <CheckCircleIcon className="w-5 h-5" />
                        <div className="text-xs font-medium hidden sm:flex">
                          Complete
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
