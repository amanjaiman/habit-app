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
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface MonthViewProps {
  date: string; // ISO date string
  habits: Habit[];
}

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
            className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
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

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[100px] p-2 ${
                isCurrentMonth
                  ? 'bg-gray-50 dark:bg-gray-800'
                  : 'bg-gray-100 dark:bg-gray-900'
              } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
            >
              <div className="flex justify-between items-start">
                <span
                  className={`text-sm ${
                    isCurrentMonth
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {isCurrentMonth && habits.length > 0 && (
                <div className="flex flex-col items-center gap-1">
                  {habits.length > 0 && isCurrentMonth && (
                    <span
                      className={`text-2xl font-bold ${
                        completionRate >= 75
                          ? 'text-green-500 dark:text-green-400'
                          : completionRate >= 50
                          ? 'text-yellow-500 dark:text-yellow-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {completionCount}/{habits.length}
                    </span>
                  )}
                  <div className="flex flex-wrap justify-center gap-1">
                    {habits.filter(habit => habit.completions[dateStr]).map((habit) => {
                      const isCompleted = habit.completions[dateStr] ?? false;
                      return (
                        <span key={habit.id} className="truncate text-sm">{habit.emoji}</span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
