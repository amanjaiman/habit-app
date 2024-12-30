import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroups, groupApi, Group, GroupHabit } from '../../contexts/GroupContext';
import { useUser } from '../../contexts/UserContext';
import GroupHabitForm from './GroupHabitForm';
import GroupHabitList from './GroupHabitList';
import GroupCalendar from './GroupCalendar';
import toast from 'react-hot-toast';

export default function GroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { state: groupState, dispatch } = useGroups();
  const { state: userState } = useUser();
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId || !userState.profile?.id) return;
      
      try {
        const fetchedGroup = await groupApi.fetchGroup(groupId, userState.profile.id);
        setGroup(fetchedGroup);
      } catch (err: any) {
        setError(err.message || 'Failed to load group');
        if (err.status === 404) {
          navigate('/groups');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId, userState.profile?.id, navigate]);

  useEffect(() => {
    if (groupId && groupState.groups) {
      const updatedGroup = groupState.groups.find(g => g.id === groupId);
      if (updatedGroup) {
        setGroup(updatedGroup);
      }
    }
  }, [groupState.groups, groupId]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group?.joinCode || '');
    toast.success('Join code copied to clipboard');
  };

  const renderMemberInfo = () => {
    const admin = group?.memberDetails.find(member => member.id === group?.adminId);
    
    return (
      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          <div className="flex -space-x-2 mr-2">
            {group?.memberDetails.slice(0, 3).map((member) => (
              member.profileImage ? (
                <img
                  key={member.id}
                  src={member.profileImage}
                  alt={member.name}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                />
              ) : (
                <div key={member.id} 
                     className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 
                              bg-gradient-to-r from-purple-600 to-pink-600 
                              flex items-center justify-center text-white text-xs font-medium">
                  {member.name[0].toUpperCase()}
                </div>
              )
            ))}
            {group?.memberDetails.length && group?.memberDetails.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
                +{group?.memberDetails.length - 3}
              </div>
            )}
          </div>
          <span>{group?.memberDetails.length} members</span>
        </div>
        {group?.adminId === userState.profile?.id && (
          <>
            <span>•</span>
            <div className="flex items-center gap-1">
              {admin?.profileImage ? (
                <img
                  src={admin.profileImage}
                  alt={admin.name}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 
                              flex items-center justify-center text-white text-xs font-medium">
                  {admin?.name[0].toUpperCase()}
                </div>
              )}
              <span>Admin: {admin?.name}</span>
            </div>
          </>
        )}
        <span>•</span>
        <button
          onClick={handleCopyCode}
          className="font-mono font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 
                    bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer"
        >
          {group?.joinCode}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-8 lg:px-12">
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-white/30 dark:bg-gray-900/30 rounded-2xl"></div>
          <div className="h-64 bg-white/30 dark:bg-gray-900/30 rounded-2xl"></div>
        </div>
      </main>
    );
  }

  if (error || !group) {
    return (
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-8 lg:px-12">
        <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                      border border-white/20 dark:border-gray-800/30 shadow-xl text-center">
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {error || 'Group not found'}
          </p>
        </div>
      </main>
    );
  }

  const isAdmin = group.adminId === userState.profile?.id;

  return (
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-8 lg:px-12">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 
                      rounded-2xl p-8 border border-white/20 dark:border-gray-800/30 shadow-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/groups')}
              className="p-2 hover:bg-white/10 dark:hover:bg-gray-800/30 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="sm:text-start text-4xl leading-[3rem] font-black flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 
                          dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
                  {group.name}
                </span>
                <span className="mb-2">{group.emoji}</span>
              </h1>
              {group.description && (
                <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                  {group.description}
                </p>
              )}
              {renderMemberInfo()}
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsHabitFormOpen(true)}
              className="mt-4 sm:mt-0 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 
                      hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl 
                      transition-all duration-200 flex items-center space-x-2 font-medium"
            >
              <span>Add Habit</span>
            </button>
          )}
        </div>

        {group.habits.length === 0 ? (
          <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                        border border-white/20 dark:border-gray-800/30 shadow-xl text-center">
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {isAdmin 
                ? "No habits added yet. Create a habit to get started!" 
                : "No habits have been added to this group yet."}
            </p>
          </div>
        ) : (
          <>
            {/* Group Progress Section */}
            <div className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                          border border-white/20 dark:border-gray-800/30 shadow-xl">
              <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 
                          dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
                Group Progress
              </h2>
              <GroupCalendar group={group} />
            </div>

            {/* Habits List */}
            <div className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                          border border-white/20 dark:border-gray-800/30 shadow-xl">
              <GroupHabitList 
                habits={group.habits} 
                groupId={group.id}
                isAdmin={isAdmin}
                groupMembersLength={group.memberDetails.length}
                members={group.memberDetails}
              />
            </div>
          </>
        )}

        {/* Add Habit Modal */}
        <GroupHabitForm 
          isOpen={isHabitFormOpen} 
          onClose={() => setIsHabitFormOpen(false)}
          groupId={group.id}
        />
      </div>
    </main>
  );
} 