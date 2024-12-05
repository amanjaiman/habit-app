import { format } from 'date-fns';
import { Habit } from '../../types/habit';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface HabitDayModalProps {
  date: Date;
  habits: Habit[];
  onClose: () => void;
  onToggleHabit: (habitId: string, date: Date) => void;
}

export default function HabitDayModal({ date, habits, onClose, onToggleHabit }: HabitDayModalProps) {
  const dateStr = format(date, 'yyyy-MM-dd');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {format(date, 'EEEE, MMMM d, yyyy')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-3">
          {habits.map((habit) => {
            const isCompleted = habit.completions[dateStr] ?? false;
            
            return (
              <div
                key={habit.id}
                onClick={() => onToggleHabit(habit.id, date)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 
                          dark:hover:bg-gray-700 cursor-pointer"
              >
                {isCompleted ? (
                  <CheckCircleSolidIcon className="w-6 h-6 text-green-500" />
                ) : (
                  <CheckCircleIcon className="w-6 h-6 text-gray-400" />
                )}
                <span className="text-xl mr-2">{habit.emoji}</span>
                <span className="flex-1">{habit.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 