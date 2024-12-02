import { useState } from 'react';
import { useHabits, createHabit } from '../contexts/HabitContext';
import HabitForm from './HabitForm';
import HabitList from './HabitList';
import Calendar from './Calendar/Calendar';

export default function Dashboard() {
  const { state } = useHabits();
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 
                    rounded-2xl p-8 border border-white/20 dark:border-gray-800/30 shadow-xl">
        <div>
          <h1 className="text-4xl leading-[3rem] font-black bg-gradient-to-r from-purple-600 to-pink-600 
                       dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-lg">
            Track your daily habits and build consistency
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 
                   hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl 
                   transition-all duration-200 flex items-center space-x-2 font-medium"
        >
          <span>Add Habit</span>
        </button>
      </div>

      {state.habits.length === 0 && (
        <div className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                        border border-white/20 dark:border-gray-800/30 shadow-xl text-center text-gray-600 dark:text-gray-400 text-lg">
          No habits found. Add a habit to get started.
        </div>
      )}

      {state.habits.length > 0 && (
        <>
          {/* Calendar Section */}
          <div className="relative z-0">
            <Calendar />
          </div>

          {/* Habits List */}
          <div className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                        border border-white/20 dark:border-gray-800/30 shadow-xl">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                        dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text mb-6">
              Your Habits
            </h2>
            <HabitList habits={state.habits} />
          </div>
        </>
      )}

      {/* Add Habit Modal */}
      <HabitForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
}
