import { useState } from 'react';
import { useGroups, groupApi, GroupHabit } from '../../contexts/GroupContext';
import { useUser } from '../../contexts/UserContext';
import { format } from 'date-fns';
import { DEFAULT_CATEGORIES } from '../../types/habit';
import HabitForm from '../HabitForm';
import GroupHabitForm from './GroupHabitForm';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface GroupMember {
  id: string;
  name: string;
  profileImage?: string;
}

interface GroupHabitListProps {
  habits: GroupHabit[];
  groupId: string;
  isAdmin: boolean;
  groupMembersLength: number;
  members: GroupMember[];
}

export default function GroupHabitList({ habits, groupId, isAdmin, groupMembersLength, members }: GroupHabitListProps) {
  const { dispatch } = useGroups();
  const { state: userState } = useUser();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const today = format(new Date(), 'yyyy-MM-dd');
  const [editingHabit, setEditingHabit] = useState<GroupHabit | null>(null);

  const handleToggle = async (habitId: string) => {
    if (!userState.profile?.id) return;
    
    setLoading(prev => ({ ...prev, [habitId]: true }));
    
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const isCompleted = habit.completions.some(
        c => c.userId === userState.profile?.id && c.date === today && c.completed
      );

      await groupApi.toggleHabit(
        groupId,
        habitId,
        today,
        !isCompleted,
        userState.profile.id
      );

      dispatch({
        type: 'TOGGLE_HABIT_COMPLETION',
        payload: {
          groupId,
          habitId,
          completion: {
            userId: userState.profile.id,
            date: today,
            completed: !isCompleted
          }
        }
      });
    } catch (error) {
      console.error('Failed to toggle habit:', error);
    } finally {
      setLoading(prev => ({ ...prev, [habitId]: false }));
    }
  };

  const calculateStreak = (habit: GroupHabit) => {
    let streak = 0;
    const currentDate = new Date();
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const date = format(new Date(currentDate.setDate(currentDate.getDate() - (i === 0 ? 0 : 1))), 'yyyy-MM-dd');
      const completionsForDay = habit.completions.filter(c => c.date === date && c.completed);
      
      if (completionsForDay.length >= groupMembersLength / 2) { // More than 50% completed
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const calculateStats = (habit: GroupHabit) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const completedToday = habit.completions
      .filter(c => c.date === today && c.completed)
      .map(c => members.find(m => m.id === c.userId))
      .filter((m): m is GroupMember => m !== undefined);

    const notCompletedToday = members.filter(
      member => !habit.completions.some(c => 
        c.userId === member.id && c.date === today && c.completed
      )
    );

    return {
      completedToday,
      notCompletedToday,
      streak: calculateStreak(habit)
    };
  };

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

  return (
    <div className="space-y-4">
      {habits.map((habit) => {
        const stats = calculateStats(habit);
        const category = DEFAULT_CATEGORIES.find(cat => cat.id === habit.category);
        const isCompleted = habit.completions.some(
          c => c.userId === userState.profile?.id && c.date === today && c.completed
        );

        return (
          <div key={habit.id} className="p-4 rounded-xl border border-white/20 
                     dark:border-gray-800/30 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 
                     shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleToggle(habit.id)}
                  disabled={loading[habit.id]}
                  className={`flex items-center justify-center w-12 h-12 rounded-lg shadow-md 
                          transition-all duration-200 ${
                            isCompleted
                              ? 'bg-green-500 dark:bg-green-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                          }`}
                  style={{
                    backgroundColor: isCompleted ? habit.color : undefined,
                  }}
                >
                  <span className="text-xl">{habit.emoji}</span>
                </button>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {habit.name}
                  </h3>
                  {category && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {category.name} • {stats.streak} day streak 🔥
                    </p>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center space-x-2">
                    <button
                    onClick={() => setEditingHabit(habit)}
                    className="p-2 text-gray-600 hover:text-purple-600 dark:text-gray-300 
                            dark:hover:text-purple-400 rounded-lg hover:bg-purple-100/50 
                            dark:hover:bg-purple-900/30 transition-all duration-200"
                    >
                    <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-2 text-gray-600 hover:text-pink-600 dark:text-gray-300 
                            dark:hover:text-pink-400 rounded-lg hover:bg-pink-100/50 
                            dark:hover:bg-pink-900/30 transition-all duration-200"
                    >
                    <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-start mt-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Completed today:
                </p>
                <div className="flex -space-x-2">
                  {stats.completedToday.map(member => (
                    <div key={member.id} className="relative group">
                      {member.profileImage ? <img
                        src={member.profileImage}
                        alt={member.name}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                      /> : <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                        <span className="text-white">{member.name.charAt(0)}</span>
                      </div>}

                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 
                                     text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 
                                     transition-opacity duration-200">
                        {member.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {stats.notCompletedToday.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Still need to complete:
                  </p>
                <div className="flex -space-x-2">
                  {stats.notCompletedToday.map(member => (
                    <div key={member.id} className="relative group">
                      {member.profileImage ? <img
                        src={member.profileImage}
                        alt={member.name}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                      /> : <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                        <span className="text-white">{member.name.charAt(0)}</span>
                      </div>}
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 
                                     text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 
                                     transition-opacity duration-200">
                        {member.name}
                      </span>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <GroupHabitForm
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        habitToEdit={editingHabit ?? undefined}
        groupId={groupId}
      />
    </div>
  );
} 