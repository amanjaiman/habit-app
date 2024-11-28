import { useState } from 'react';
import { Habit } from '../types/habit';
import { useHabits } from '../contexts/HabitContext';
import { format } from 'date-fns';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import HabitForm from './HabitForm';
import { DEFAULT_CATEGORIES } from '../types/habit';

interface HabitItemProps {
  habit: Habit;
  date?: string; // ISO date string, defaults to today
}

export default function HabitItem({ habit, date = format(new Date(), 'yyyy-MM-dd') }: HabitItemProps) {
  const { dispatch } = useHabits();
  const [showEdit, setShowEdit] = useState(false);
  const isCompleted = habit.completions[date] ?? false;

  const toggleCompletion = () => {
    dispatch({
      type: 'TOGGLE_COMPLETION',
      payload: {
        habitId: habit.id,
        date,
        completed: !isCompleted,
      },
    });
  };

  return (
    <>
      <div className="group relative flex items-center justify-between p-4 bg-white/30 dark:bg-gray-900/30 
                    rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleCompletion}
            className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 
                     rounded-full transition-colors duration-200"
          >
            {isCompleted ? (
              <CheckCircleSolidIcon className="w-8 h-8 text-green-500 dark:text-green-400" />
            ) : (
              <CheckCircleIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 
                                       hover:text-gray-500 dark:hover:text-gray-400" />
            )}
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">{habit.emoji}</span>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {habit.name}
              </h3>
            </div>
            {habit.color && (
              <div className="flex items-center space-x-2 mt-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: habit.color }}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {habit.color}
                </span>
              </div>
            )}
            {habit.category && (
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                {DEFAULT_CATEGORIES.find(c => c.id === habit.category)?.name}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowEdit(true)}
          className="opacity-0 group-hover:opacity-100 px-3 py-1 text-sm text-gray-500 
                   dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 
                   transition-opacity duration-200"
        >
          Edit
        </button>
      </div>

      <HabitForm
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        habitToEdit={habit}
      />
    </>
  );
}
