import { format, startOfWeek, addDays, parseISO, isSameDay } from 'date-fns';
import { Habit } from '../../types/habit';
import { habitApi, useHabits } from '../../contexts/HabitContext';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useUser } from '../../contexts/UserContext';

interface WeekViewProps {
  startDate: string; // ISO date string
  habits: Habit[];
}

export default function WeekView({ startDate, habits }: WeekViewProps) {
  const { dispatch } = useHabits();
  const { state: userState } = useUser();
  const weekStart = startOfWeek(parseISO(startDate), { weekStartsOn: 1 });
  
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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

  return (
    <div className="overflow-x-auto p-6">
      <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50 
                        backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl 
                        shadow-xl border border-white/20 dark:border-gray-800/30">
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
          {habits.map((habit) => {
            const completedWeek = isHabitCompletedForWeek(habit);
            
            return (
              <tr key={habit.id} 
                  className={`transition-colors duration-300
                             ${completedWeek 
                               ? 'bg-gradient-to-r from-green-100/75 to-emerald-100/75 dark:from-green-900/30 dark:to-emerald-900/30' 
                               : 'hover:bg-white/50 dark:hover:bg-gray-800/50'
                             }`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{habit.emoji}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {habit.name}
                    </span>
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
                        isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
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
        </tbody>
      </table>
    </div>
  );
}
