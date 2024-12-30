import { format, startOfWeek, addDays, parseISO, isSameDay } from 'date-fns';
import { DEFAULT_CATEGORIES, Habit } from '../../types/habit';
import { habitApi, useHabits } from '../../contexts/HabitContext';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useUser } from '../../contexts/UserContext';
import { FireIcon } from '@heroicons/react/24/solid';
import { calculateStreak } from '../../utils/helpers';
import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useHabitDisplay } from '../../contexts/HabitDisplayContext';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { GroupHabitCompletion, useGroups } from '../../contexts/GroupContext';
import { groupApi } from '../../contexts/GroupContext';
import { Link } from 'react-router-dom';

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

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const { state: groupState, dispatch: groupDispatch } = useGroups();
  const [groupHabitsCollapsed, setGroupHabitsCollapsed] = useState(false);

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

  const toggleHabit = async (habitId: string, date: Date) => {
    if (!userState.profile?.id) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const habit = habits.find(h => h.id === habitId);
    const isCompleted = habit?.completions[dateStr] ?? false;

    try {
      await habitApi.toggle(userState.profile.id, habitId, dateStr, !isCompleted);
      dispatch({
        type: 'TOGGLE_COMPLETION',
        payload: {
          habitId,
          date: dateStr,
          completed: !isCompleted,
        },
      });
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    }
  };

  const isHabitCompletedForWeek = (habit: Habit) => {
    return weekDays.every(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return habit.completions[dateStr] ?? false;
    });
  };

  const groupedHabits = habits.reduce((acc, habit) => {
    const categoryId = habit.category || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(habit);
    return acc;
  }, {} as Record<string, Habit[]>);

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

  const toggleGroupHabit = async (groupId: string, habitId: string, date: Date) => {
    if (!userState.profile?.id) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const group = groupState.groups.find(g => g.id === groupId);
    const habit = group?.habits.find(h => h.id === habitId);
    const isCompleted = habit?.completions.some(
      c => c.userId === userState.profile?.id && c.date === dateStr
    ) ?? false;

    try {
      await groupApi.toggleHabit(groupId, habitId, dateStr, !isCompleted, userState.profile.id);
      groupDispatch({
        type: 'TOGGLE_HABIT_COMPLETION',
        payload: {
          groupId,
          habitId,
          completion: {
            userId: userState.profile.id,
            date: dateStr,
            completed: !isCompleted
          }
        }
      });
    } catch (error) {
      console.error('Failed to toggle group habit:', error);
    }
  };

  return (
    <div className="overflow-x-auto p-4 sm:p-6">
      <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50 
                        backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl 
                        shadow-xl border border-white/20 dark:border-gray-800/30 overflow-hidden">
        <thead>
          <tr>
            <th className="px-6 py-4 text-left">
              <span className="text-sm font-medium bg-gradient-to-r from-purple-600 
                              to-pink-600 dark:from-purple-400 dark:to-pink-400 
                              text-transparent bg-clip-text uppercase">
                Habit
              </span>
            </th>
            {weekDays.map((day) => (
              <th key={day.toString()} className="px-6 py-4 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {format(day, 'EEE')}
                  </span>
                  <span className="mt-1 text-2xl font-bold bg-gradient-to-br 
                                 from-purple-600 to-pink-600 dark:from-purple-400 
                                 dark:to-pink-400 text-transparent bg-clip-text">
                    {format(day, 'd')}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
          {groupHabits ? (
            Object.entries(groupedHabits).map(([categoryId, categoryHabits]) => {
              const category = DEFAULT_CATEGORIES.find(c => c.id === categoryId) || {
                id: 'uncategorized',
                name: 'Other',
                color: '#6B7280',
                darkColor: '#9CA3AF'
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
                            collapsedCategories.has(categoryId) ? '-rotate-90' : ''
                          }`}
                          style={{ color: theme === 'dark' ? category.darkColor : category.color }}
                        />
                        <span className="text-sm font-medium"
                              style={{ color: theme === 'dark' ? category.darkColor : category.color }}>
                          {category.name}
                        </span>
                      </button>
                    </td>
                  </tr>
                  
                  {!collapsedCategories.has(categoryId) && categoryHabits.map((habit) => {
                    const completedWeek = isHabitCompletedForWeek(habit);
                    const streak = calculateStreak(habit.completions);
                    
                    return (
                      <tr key={habit.id} 
                          className={`transition-all duration-300 ease-in-out
                                     ${completedWeek 
                                       ? 'bg-gradient-to-r from-green-100/75 to-emerald-100/75 dark:from-green-900/30 dark:to-emerald-900/30' 
                                       : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
                                     }`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{habit.emoji}</span>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {habit.name}
                                </span>
                                {streak > 0 && (
                                  <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-orange-100/50 dark:bg-orange-900/30">
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
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const isCompleted = habit.completions[dateStr] ?? false;
                          const isToday = isSameDay(day, new Date());

                          return (
                            <td
                              key={day.toISOString()}
                              className={`px-6 py-4 text-center ${
                                isToday ? 'bg-blue-100/40 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <button
                                onClick={() => toggleHabit(habit.id, day)}
                                className="inline-flex items-center justify-center"
                              >
                                {isCompleted ? (
                                  <CheckCircleSolidIcon className="w-6 h-6 text-green-500 dark:text-green-400" />
                                ) : (
                                  <CheckCircleIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })
          ) : (
            habits.map((habit) => (
              <tr key={habit.id} className="hover:bg-white/50 dark:hover:bg-gray-800/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{habit.emoji}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {habit.name}
                        </span>
                        {calculateStreak(habit.completions) > 0 && (
                          <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-orange-100/50 dark:bg-orange-900/30">
                            <FireIcon className="w-3 h-3 text-orange-500" />
                            <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                              {calculateStreak(habit.completions)}d
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isCompleted = habit.completions[dateStr] ?? false;
                  const isToday = isSameDay(day, new Date());

                  return (
                    <td
                      key={day.toISOString()}
                      className={`px-6 py-4 text-center ${
                        isToday ? 'bg-blue-100/40 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <button
                        onClick={() => toggleHabit(habit.id, day)}
                        className="inline-flex items-center justify-center"
                      >
                        {isCompleted ? (
                          <CheckCircleSolidIcon className="w-6 h-6 text-green-500 dark:text-green-400" />
                        ) : (
                          <CheckCircleIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))
          )}
          {getAllGroupHabits().length > 0 && (
            <>
              <tr className="bg-purple-50/50 dark:bg-purple-900/20">
                <td colSpan={8} className="px-6 py-2">
                  <button
                    onClick={() => setGroupHabitsCollapsed(prev => !prev)}
                    className="flex items-center space-x-2 w-full"
                  >
                    <ChevronDownIcon 
                      className={`w-4 h-4 transition-transform duration-200 text-purple-600 dark:text-purple-400 ${
                        groupHabitsCollapsed ? '-rotate-90' : ''
                      }`}
                    />
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Group Habits
                    </span>
                  </button>
                </td>
              </tr>

              {!groupHabitsCollapsed && getAllGroupHabits().map((habit) => {
                const streak = calculateGroupHabitStreak(habit.completions, userState.profile?.id || '');
                
                return (
                  <tr key={`${habit.groupId}-${habit.id}`}
                      className="hover:bg-white/50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{habit.emoji}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {habit.name}
                            </span>
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
                    </td>
                    {weekDays.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const isCompleted = habit.completions.some(
                        c => c.userId === userState.profile?.id && c.date === dateStr
                      );
                      const isToday = isSameDay(day, new Date());

                      return (
                        <td
                          key={day.toISOString()}
                          className={`px-6 py-4 text-center ${
                            isToday ? 'bg-blue-100/40 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <button
                            onClick={() => toggleGroupHabit(habit.groupId, habit.id, day)}
                            className="inline-flex items-center justify-center"
                          >
                            {isCompleted ? (
                              <CheckCircleSolidIcon className="w-6 h-6 text-green-500 dark:text-green-400" />
                            ) : (
                              <CheckCircleIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                            )}
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
    </div>
  );
}
