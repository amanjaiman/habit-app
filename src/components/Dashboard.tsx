import { useState } from "react";
import { useHabits } from "../contexts/HabitContext";
import HabitForm from "./HabitForm";
import HabitList from "./HabitList";
import Calendar from "./Calendar/Calendar";
import { useUser } from "../contexts/UserContext";
import { useGroups } from "../contexts/GroupContext";

export default function Dashboard() {
  const { state: userState } = useUser();
  const { state } = useHabits();
  const { state: groupState } = useGroups();
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Combine individual and group habits
  const allGroupHabits = groupState.groups.flatMap((group) =>
    group.habits.map((habit) => ({
      ...habit,
      groupName: group.name,
      groupEmoji: group.emoji,
      groupId: group.id,
    }))
  );

  const hasAnyHabits = state.habits.length > 0 || allGroupHabits.length > 0;

  return (
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-8 lg:px-12">
      <div className="space-y-8">
        {/* Header Section */}
        <div
          className="flex flex-col sm:flex-row justify-between items-center backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 
                      rounded-2xl p-8 border border-white/20 dark:border-gray-800/30 shadow-xl"
        >
          <div>
            <h1
              className="sm:text-start text-4xl leading-[3rem] font-black bg-gradient-to-r from-purple-600 to-pink-600 
                        dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
            >
              Hello, {userState.name}!
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300 text-base sm:text-lg">
              Track your daily habits and build consistency
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="mt-4 sm:mt-0 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 
                    hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl 
                    transition-all duration-200 flex items-center space-x-2 font-medium"
          >
            <span>Add Habit</span>
          </button>
        </div>

        {!hasAnyHabits && (
          <div
            className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                          border border-white/20 dark:border-gray-800/30 shadow-xl text-center text-gray-600 dark:text-gray-300 text-lg"
          >
            No habits found. Add a habit to get started.
          </div>
        )}

        {hasAnyHabits && (
          <>
            {/* Calendar Section */}
            <div className="relative z-0">
              <Calendar />
            </div>

            {/* Habits List */}
            <div
              className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                          border border-white/20 dark:border-gray-800/30 shadow-xl"
            >
              <HabitList habits={state.habits} groupHabits={allGroupHabits} />
            </div>
          </>
        )}

        {/* Add Habit Modal */}
        <HabitForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
      </div>
    </main>
  );
}
