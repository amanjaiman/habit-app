import { format, parseISO } from 'date-fns';
import { DEFAULT_CATEGORIES, Habit, HabitCategory, HabitCompletions } from '../../types/habit';
import { habitApi, useHabits } from '../../contexts/HabitContext';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { useUser } from '../../contexts/UserContext';
import { FireIcon } from '@heroicons/react/24/solid';
import { useCallback, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { calculateStreak } from '../../utils/helpers';
import { useHabitDisplay } from '../../contexts/HabitDisplayContext';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { GroupHabitCompletion, useGroups } from '../../contexts/GroupContext';
import { groupApi } from '../../contexts/GroupContext';
import { Link } from 'react-router-dom';

interface DayViewProps {
  date: string; // ISO date string
  habits: Habit[];
}

export default function DayView({ date, habits }: DayViewProps) {
  const { dispatch } = useHabits();
  const { state: userState } = useUser();
  const { theme } = useTheme();
  const { groupHabits } = useHabitDisplay();
  const formattedDate = format(parseISO(date), 'EEEE, MMMM d');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const { state: groupState, dispatch: groupDispatch } = useGroups();
  const [groupHabitsCollapsed, setGroupHabitsCollapsed] = useState(false);

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

  const groupedHabits = habits.reduce((acc, habit) => {
    const categoryId = habit.category || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(habit);
    return acc;
  }, {} as Record<string, Habit[]>);

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const toggleGroupHabit = async (groupId: string, habitId: string) => {
    if (!userState.profile?.id) return;

    const group = groupState.groups.find(g => g.id === groupId);
    const habit = group?.habits.find(h => h.id === habitId);
    const isCompleted = habit?.completions.some(
      c => c.userId === userState.profile?.id && c.date === date
    ) ?? false;

    try {
      await groupApi.toggleHabit(groupId, habitId, date, !isCompleted, userState.profile.id);
      groupDispatch({
        type: 'TOGGLE_HABIT_COMPLETION',
        payload: {
          groupId,
          habitId,
          completion: {
            userId: userState.profile.id,
            date,
            completed: !isCompleted
          }
        }
      });
    } catch (error) {
      console.error('Failed to toggle group habit:', error);
    }
  };

  const getAllGroupHabits = () => {
    return groupState.groups.flatMap(group => 
      group.habits.map(habit => ({
        ...habit,
        groupId: group.id,
        groupName: group.name,
        groupEmoji: group.emoji
      }))
    );
  };

  const calculateGroupHabitStreak = (completions: GroupHabitCompletion[], userId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const isCompleted = completions.some(
        c => c.userId === userId && c.date === dateStr && c.completed
      );

      if (!isCompleted) break;
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

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

      <div className="space-y-6">
        {groupHabits ? (
          Object.entries(groupedHabits).map(([categoryId, categoryHabits]) => {
            const category = DEFAULT_CATEGORIES.find(c => c.id === categoryId) || {
              id: 'uncategorized',
              name: 'Other',
              color: '#6B7280',
              darkColor: '#9CA3AF'
            };
            
            return (
              <div key={categoryId} className="space-y-3">
                <button
                  onClick={() => toggleCategory(categoryId)}
                  className="flex items-center space-x-2 w-full"
                >
                  <ChevronDownIcon 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      collapsedCategories.has(categoryId) ? '-rotate-90' : ''
                    }`}
                    style={{ color: theme === 'dark' ? category.darkColor : category.color }}
                  />
                  <h3 className="text-lg font-semibold" 
                      style={{ color: theme === 'dark' ? category.darkColor : category.color }}>
                    {category.name}
                  </h3>
                </button>
                
                {!collapsedCategories.has(categoryId) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 
                                transition-all duration-300 ease-in-out">
                    {categoryHabits.map((habit) => {
                      const isCompleted = habit.completions[date] ?? false;
                      const streak = calculateStreak(habit.completions);

                      return (
                        <div
                          key={habit.id}
                          className={`rounded-xl transition-all duration-200 overflow-hidden
                                    border border-white/20 dark:border-gray-800/30
                                    ${isCompleted 
                                      ? 'bg-green-300/25 dark:bg-green-900/30' 
                                      : 'bg-white/30 dark:bg-gray-900/30'}`}
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
                                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition-all duration-200 hover:opacity-80"
                              >
                                {isCompleted ? (
                                  <div className="flex items-center space-x-1.5">
                                    <CheckCircleSolidIcon className="w-6 h-6 text-green-500 dark:text-green-400" />
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1.5">
                                    <CheckCircleIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                  </div>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                              : 'bg-white/30 dark:bg-gray-900/30'}`}
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
                        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition-all duration-200 hover:opacity-80"
                      >
                        {isCompleted ? (
                          <div className="flex items-center space-x-1.5">
                            <CheckCircleSolidIcon className="w-6 h-6 text-green-500 dark:text-green-400" />
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5">
                            <CheckCircleIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {getAllGroupHabits().length > 0 && (
        <div className="mt-8 space-y-3">
          <button
            onClick={() => setGroupHabitsCollapsed(prev => !prev)}
            className="flex items-center space-x-2 w-full"
          >
            <ChevronDownIcon 
              className={`w-4 h-4 transition-transform duration-200 ${
                groupHabitsCollapsed ? '-rotate-90' : ''
              }`}
            />
            <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">
              Group Habits
            </h3>
          </button>

          {!groupHabitsCollapsed && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getAllGroupHabits().map((habit) => {
                const isCompleted = habit.completions.some(
                  c => c.userId === userState.profile?.id && c.date === date
                );
                const streak = calculateGroupHabitStreak(habit.completions, userState.profile?.id || '');

                return (
                  <div
                    key={`${habit.groupId}-${habit.id}`}
                    className={`rounded-xl transition-all duration-200 overflow-hidden
                              border border-white/20 dark:border-gray-800/30
                              ${isCompleted 
                                ? 'bg-green-100/50 dark:bg-green-900/20' 
                                : 'bg-white/30 dark:bg-gray-900/30'}`}
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
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                <Link to={`/groups/${habit.groupId}`} className="hover:text-purple-600 dark:hover:text-purple-400">
                                  {habit.groupEmoji} {habit.groupName}
                                </Link>
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleGroupHabit(habit.groupId, habit.id)}
                          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md 
                                   transition-all duration-200 hover:opacity-80"
                        >
                          {isCompleted ? (
                            <CheckCircleSolidIcon className="w-6 h-6 text-green-500 dark:text-green-400" />
                          ) : (
                            <CheckCircleIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
