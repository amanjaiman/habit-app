import { useState } from 'react';
import { useGroups, groupApi } from '../../contexts/GroupContext';
import { useUser } from '../../contexts/UserContext';
import GroupList from './GroupList';
import GroupForm from './GroupForm';
import JoinGroupModal from './JoinGroupModal';

export default function Groups() {
  const { state: userState } = useUser();
  const { state } = useGroups();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  return (
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-8 lg:px-12">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 
                      rounded-2xl p-8 border border-white/20 dark:border-gray-800/30 shadow-xl">
          <div>
            <h1 className="sm:text-start text-4xl leading-[3rem] font-black bg-gradient-to-r from-purple-600 to-pink-600 
                        dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
              Your Groups
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300 text-base sm:text-lg">
              Build habits together with friends and family
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="px-4 sm:px-6 py-2 sm:py-3 border-2 border-purple-600 dark:border-purple-400 
                      text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white
                      dark:hover:bg-purple-400 dark:hover:text-gray-900
                      rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 
                      flex items-center justify-center space-x-2 font-medium"
            >
              <span>Join Group</span>
            </button>
            <button
              onClick={() => setIsCreateFormOpen(true)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 
                      hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg 
                      hover:shadow-xl transition-all duration-200 flex items-center 
                      justify-center space-x-2 font-medium"
            >
              <span>Create Group</span>
            </button>
          </div>
        </div>

        {state.loading ? (
          <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                        border border-white/20 dark:border-gray-800/30 shadow-xl text-center">
            <div className="animate-pulse text-gray-600 dark:text-gray-300">
              Loading groups...
            </div>
          </div>
        ) : state.groups.length === 0 ? (
          <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                        border border-white/20 dark:border-gray-800/30 shadow-xl text-center">
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              You're not part of any groups yet. Create a new group or join an existing one!
            </p>
          </div>
        ) : (
          <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                        border border-white/20 dark:border-gray-800/30 shadow-xl">
            <GroupList groups={state.groups} />
          </div>
        )}

        {/* Create Group Modal */}
        <GroupForm 
          isOpen={isCreateFormOpen} 
          onClose={() => setIsCreateFormOpen(false)} 
        />

        {/* Join Group Modal */}
        <JoinGroupModal 
          isOpen={isJoinModalOpen} 
          onClose={() => setIsJoinModalOpen(false)} 
        />
      </div>
    </main>
  );
}