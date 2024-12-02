import { useState } from 'react';
import { DEFAULT_CATEGORIES, Habit } from '../types/habit';
import { habitApi, useHabits } from '../contexts/HabitContext';
import HabitForm from './HabitForm';
import { TrashIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useUser } from '../contexts/UserContext';

interface HabitListProps {
  habits: Habit[];
}

export default function HabitList({ habits }: HabitListProps) {
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { dispatch } = useHabits();
  const { state: userState } = useUser();

  const handleDelete = async (id: string) => {
    if (!userState.profile?.id) return;

    if (window.confirm('Are you sure you want to delete this habit?')) {
      try {
        await habitApi.delete(userState.profile.id, id);
        dispatch({ type: 'REMOVE_HABIT', payload: id });
      } catch (error) {
        console.error('Failed to delete habit:', error);
      }
    }
  };

  return (
    <>
      <div className="flex items-center space-x-4 mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                      dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
          Your Habits
        </h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="p-1.5 mt-0.5 rounded-lg bg-white/40 dark:bg-gray-800/40 hover:bg-white/70 
                   dark:hover:bg-gray-800/70 transition-all duration-200 group"
        >
          <PlusIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform" />
        </button>
      </div>

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

      <HabitForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </>
  );
}
