import { useState } from 'react';
import { DEFAULT_CATEGORIES, Habit } from '../types/habit';
import { useHabits } from '../contexts/HabitContext';
import HabitForm from './HabitForm';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface HabitListProps {
  habits: Habit[];
}

export default function HabitList({ habits }: HabitListProps) {
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const { dispatch } = useHabits();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      dispatch({ type: 'REMOVE_HABIT', payload: id });
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="flex items-center p-4 rounded-xl transition-all duration-200 
                         backdrop-blur-sm border border-white/20 dark:border-gray-800/30
                         hover:shadow-xl"
          >
            <div className="flex-1 flex items-center space-x-3">
                <span className="text-xl">{habit.emoji}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {habit.name}
                </span>
              </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEditingHabit(habit)}
                className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 
                         dark:hover:text-purple-400 rounded-lg hover:bg-purple-100/50 
                         dark:hover:bg-purple-900/30 transition-all duration-200"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(habit.id)}
                className="p-2 text-gray-500 hover:text-pink-600 dark:text-gray-400 
                         dark:hover:text-pink-400 rounded-lg hover:bg-pink-100/50 
                         dark:hover:bg-pink-900/30 transition-all duration-200"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <HabitForm
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        habitToEdit={editingHabit ?? undefined}
      />
    </>
  );
}
