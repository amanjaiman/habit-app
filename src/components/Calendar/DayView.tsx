import { format, parseISO } from 'date-fns';
import { Habit } from '../../types/habit';
import { habitApi, useHabits } from '../../contexts/HabitContext';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { useUser } from '../../contexts/UserContext';

interface DayViewProps {
  date: string; // ISO date string
  habits: Habit[];
}

export default function DayView({ date, habits }: DayViewProps) {
  const { dispatch } = useHabits();
  const { state: userState } = useUser();
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

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                       dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
          {formattedDate}
        </h3>
        <div className="flex items-center gap-2">
          {allCompleted && (
            <SparklesIcon className="w-5 h-5 text-yellow-400 animate-pulse" />
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400 bg-white/50 
                        dark:bg-gray-800/50 px-4 py-2 rounded-full">
            {completedCount} of {habits.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map((habit) => {
          const isCompleted = habit.completions[date] ?? false;

          return (
            <button
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              className={`flex items-center p-4 rounded-xl transition-all duration-200 
                         backdrop-blur-sm border border-white/20 dark:border-gray-800/30
                         hover:shadow-xl ${
                           isCompleted 
                             ? 'bg-green-50/50 dark:bg-green-900/20' 
                             : 'bg-white/30 dark:bg-gray-900/30'
                         }`}
            >
              <div className="flex-1 flex items-center space-x-3">
                <span className="text-xl">{habit.emoji}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {habit.name}
                </span>
              </div>
              
              {isCompleted ? (
                <CheckCircleSolidIcon 
                  className="w-6 h-6 text-green-500 dark:text-green-400 
                             transition-transform duration-200 hover:scale-110" 
                />
              ) : (
                <CheckCircleIcon 
                  className="w-6 h-6 text-gray-400 dark:text-gray-500
                             transition-transform duration-200 hover:scale-110" 
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
