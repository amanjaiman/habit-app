import { useState } from 'react';
import { useGroups, groupApi, GroupHabit } from '../../contexts/GroupContext';
import { format } from 'date-fns';
import { DEFAULT_CATEGORIES } from '../../types/habit';
import HabitForm from '../HabitForm';
import GroupHabitForm from './GroupHabitForm';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useUser } from '../../contexts/UserContext';

interface GroupMember {
  id: string;
  name: string;
  profileImage?: string;
}

interface GroupHabitListProps {
  habits: GroupHabit[];
  groupId: string;
  isAdmin: boolean;
}

export default function GroupHabitList({ habits, groupId, isAdmin }: GroupHabitListProps) {
  const { dispatch } = useGroups();
  const { state: userState } = useUser();
  const [editingHabit, setEditingHabit] = useState<GroupHabit | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleDelete = async (habitId: string) => {
    if (!userState.profile?.id) return;

    if (window.confirm('Are you sure you want to delete this habit?')) {
      try {
        await groupApi.deleteHabit(groupId, habitId, userState.profile.id);
        dispatch({
          type: 'REMOVE_GROUP_HABIT',
          payload: { groupId, habitId }
        });
      } catch (error) {
        console.error('Failed to delete habit:', error);
      }
    }
  };

  const habitCardClasses = "flex items-center p-4 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20 dark:border-gray-800/30 hover:shadow-xl hover:border-purple-200/30 dark:hover:border-purple-800/30";
  const habitNameClasses = "font-medium text-gray-900 dark:text-white";

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                      dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
          Manage Group Habits
        </h2>
        {isAdmin && (
          <button
            onClick={() => setIsCreating(true)}
            className="p-1.5 mt-0.5 rounded-lg bg-white/40 dark:bg-gray-800/40 hover:bg-white/70 
                     dark:hover:bg-gray-800/70 transition-all duration-200 group"
          >
            <PlusIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map((habit) => {
          const category = DEFAULT_CATEGORIES.find(cat => cat.id === habit.category);

          return (
            <div key={habit.id} className={habitCardClasses}>
              <div className="flex-1 flex items-center space-x-3">
                <span className="text-xl">{habit.emoji}</span>
                <div>
                  <span className={habitNameClasses}>
                    {habit.name}
                  </span>
                  {category && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {category.name}
                    </p>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingHabit(habit)}
                    className="p-2 text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 rounded-lg hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all duration-200"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-2 text-gray-600 hover:text-pink-600 dark:text-gray-300 dark:hover:text-pink-400 rounded-lg hover:bg-pink-100/50 dark:hover:bg-pink-900/30 transition-all duration-200"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <GroupHabitForm
        isOpen={!!editingHabit || isCreating}
        onClose={() => {
          setEditingHabit(null);
          setIsCreating(false);
        }}
        habitToEdit={editingHabit ?? undefined}
        groupId={groupId}
      />
    </div>
  );
} 