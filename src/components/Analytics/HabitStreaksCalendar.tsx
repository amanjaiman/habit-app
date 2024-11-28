import { useMemo } from 'react';
import { useHabits } from '../../contexts/HabitContext';
import { eachDayOfInterval, format, subMonths } from 'date-fns';

interface HabitStreaksCalendarProps {
  habitId: string;
}

export default function HabitStreaksCalendar({ habitId }: HabitStreaksCalendarProps) {
  const { state } = useHabits();
  const today = new Date();
  const startDate = subMonths(today, 6); // Show last 6 months

  const streakData = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: today });
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return [];

    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        date: dateStr,
        completed: habit.completions[dateStr] ? 1 : 0,
      };
    });
  }, [state.habits, habitId, startDate]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
        Habit Streaks Calendar
      </h3>
      <div className="grid grid-cols-7 gap-1">
        {streakData.map((day, index) => (
          <div
            key={index}
            className={`w-4 h-4 rounded ${day.completed ? 'bg-green-500' : 'bg-gray-300'}`}
            title={day.date}
          />
        ))}
      </div>
    </div>
  );
} 