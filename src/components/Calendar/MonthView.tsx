import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { Habit } from '../../types/habit';
import { useHabits } from '../../contexts/HabitContext';
import { FireIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';

interface MonthViewProps {
  date: string; // ISO date string
  habits: Habit[];
}

// Add these utility functions
const getMonthlyCompletionsForHabit = (habit: Habit, daysInMonth: Date[]) => {
  return daysInMonth.filter(
    day => habit.completions[format(day, 'yyyy-MM-dd')]
  ).length;
};

const getMonthlyStreakForHabit = (habit: Habit, daysInMonth: Date[]) => {
  let maxStreak = 0;
  let currentStreak = 0;

  // Sort days to ensure chronological order
  const sortedDays = [...daysInMonth].sort((a, b) => a.getTime() - b.getTime());

  sortedDays.forEach((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    if (habit.completions[dateStr]) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });

  return maxStreak;
};

export default function MonthView({ date, habits }: MonthViewProps) {
  const { dispatch } = useHabits();
  const monthStart = startOfMonth(parseISO(date));
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const toggleHabit = (habitId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const habit = habits.find(h => h.id === habitId);
    const isCompleted = habit?.completions[dateStr] ?? false;

    dispatch({
      type: 'TOGGLE_COMPLETION',
      payload: {
        habitId,
        date: dateStr,
        completed: !isCompleted,
      },
    });
  };

  const getCompletionCount = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return habits.filter(habit => habit.completions[dateStr]).length;
  };

  // Add new utility functions
  const getStreakForHabit = (habit: Habit, date: Date) => {
    let streak = 0;
    let currentDate = date;
    
    while (habit.completions[format(currentDate, 'yyyy-MM-dd')]) {
      streak++;
      currentDate = new Date(currentDate.getTime() - 86400000); // Previous day
    }
    return streak;
  };

  const getMonthlyCompletionRate = (habit: Habit) => {
    const daysInMonth = days.filter(day => isSameMonth(day, monthStart));
    const completedDays = daysInMonth.filter(
      day => habit.completions[format(day, 'yyyy-MM-dd')]
    );
    return (completedDays.length / daysInMonth.length) * 100;
  };

  // Get days in current month only
  const daysInMonth = days.filter(day => isSameMonth(day, monthStart));

  // Add state for tracking hovered habit
  const [hoveredHabitId, setHoveredHabitId] = useState<string | null>(null);
  // Add memoized streak days
  const [streakDays, setStreakDays] = useState<Set<string>>(new Set());
  
  // Memoize the streak calculation
  const calculateBestStreakDays = (habit: Habit) => {
    const daysInMonth = days.filter(day => isSameMonth(day, monthStart));
    let bestStreakStart: Date | null = null;
    let bestStreakLength = 0;
    let currentStreakStart: Date | null = null;
    let currentStreak = 0;

    // Pre-sort days once
    const sortedDays = [...daysInMonth].sort((a, b) => a.getTime() - b.getTime());
    const streakDays = new Set<string>();

    for (const day of sortedDays) {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (habit.completions[dateStr]) {
        if (currentStreak === 0) {
          currentStreakStart = day;
        }
        currentStreak++;
        if (currentStreak >= bestStreakLength) {
          bestStreakLength = currentStreak;
          bestStreakStart = currentStreakStart as Date;
        }
      } else {
        currentStreak = 0;
        currentStreakStart = null;
      }
    }

    if (bestStreakStart !== null && bestStreakLength > 0) {
      const startTime = bestStreakStart.getTime();
      for (let i = 0; i < bestStreakLength; i++) {
        const streakDay = new Date(startTime + i * 86400000);
        streakDays.add(format(streakDay, 'yyyy-MM-dd'));
      }
    }

    return streakDays;
  };

  // Update streak days when habit is hovered
  const handleHabitHover = (habitId: string | null) => {
    setHoveredHabitId(habitId);
    if (habitId) {
      const habit = habits.find(h => h.id === habitId);
      if (habit) {
        setStreakDays(calculateBestStreakDays(habit));
      }
    } else {
      setStreakDays(new Set());
    }
  };

  // Simplified check for streak days
  const isPartOfBestStreak = (date: Date) => {
    return streakDays.has(format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-4 p-6">
      <div className="text-center">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                      dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
          {format(monthStart, 'MMMM yyyy')}
        </h2>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div
            key={day}
            className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-300"
          >
            {day}
          </div>
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const completionCount = getCompletionCount(day);
          const completionRate = (completionCount / habits.length) * 100;
          const streakHighlight = hoveredHabitId && isPartOfBestStreak(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] p-2 relative group cursor-pointer 
                hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200
                ${isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900'}
                ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}
                ${hoveredHabitId ? (streakHighlight ? 'opacity-100' : 'opacity-30') : 'opacity-100'}`}
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start">
                  <span
                    className={`text-sm ${
                      isCurrentMonth
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {completionRate === 100 && (
                    <span className="text-green-500 text-xs">🏆</span>
                  )}
                </div>

                {isCurrentMonth && habits.length > 0 && (
                  <div className="flex-1 flex flex-col justify-between">
                    {/* Completion ratio */}
                    <div className="mt-1">
                      <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            completionRate >= 75
                              ? 'bg-green-500'
                              : completionRate >= 50
                              ? 'bg-yellow-500'
                              : 'bg-gray-400'
                          }`}
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Habit indicators */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[...habits]
                        .sort((a, b) => {
                          const aCompleted = a.completions[dateStr] ? 1 : 0;
                          const bCompleted = b.completions[dateStr] ? 1 : 0;
                          return bCompleted - aCompleted;
                        })
                        .map((habit) => (
                          <span
                            key={habit.id}
                            className={`text-sm transition-transform hover:scale-110 ${
                              habit.completions[dateStr] ? 'opacity-100' : 'opacity-20'
                            }`}
                            onClick={() => toggleHabit(habit.id, day)}
                          >
                            {habit.emoji}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New habit stats section */}
      {habits.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Monthly Statistics
          </h3>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {habits.map(habit => {
              const monthlyCompletions = getMonthlyCompletionsForHabit(habit, daysInMonth);
              const bestStreak = getMonthlyStreakForHabit(habit, daysInMonth);

              return (
                <div 
                  key={habit.id}
                  className="flex items-center gap-3 text-sm py-1 pl-1.5 pr-2 rounded-xl 
                    bg-white/50 dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                  onMouseEnter={() => handleHabitHover(habit.id)}
                  onMouseLeave={() => handleHabitHover(null)}
                >
                  <span className="text-lg">{habit.emoji}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {monthlyCompletions}/{daysInMonth.length}
                  </span>
                  {bestStreak > 0 && (
                    <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-orange-100/50 dark:bg-orange-900/30">
                      <FireIcon className="w-3 h-3 text-orange-500" />
                      <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                        Best: {bestStreak}d
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
