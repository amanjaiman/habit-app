import { Group } from '../../contexts/GroupContext';
import { useUser } from '../../contexts/UserContext';
import { Link } from 'react-router-dom';

interface GroupListProps {
  groups: Group[];
}

export default function GroupList({ groups }: GroupListProps) {
  const { state: userState } = useUser();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <Link
          key={group.id}
          to={`/groups/${group.id}`}
          className="block p-6 rounded-xl border border-white/20 dark:border-gray-800/30 
                   backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 
                   hover:bg-white/50 dark:hover:bg-gray-900/50
                   transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{group.emoji}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {group.name}
                </h3>
                {group.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {group.description}
                  </p>
                )}
              </div>
            </div>
            {group.adminId === userState.profile?.id && (
              <span className="px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 
                            bg-purple-100 dark:bg-purple-900/30 rounded-full">
                Admin
              </span>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
              </span>
              <span className="text-gray-400 dark:text-gray-600">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {group.habits.length} {group.habits.length === 1 ? 'habit' : 'habits'}
              </span>
            </div>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(group.joinCode);
                // You might want to add a toast notification here
              }}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 
                       dark:hover:text-purple-300 font-medium"
            >
              Share Code: {group.joinCode}
            </button>
          </div>
        </Link>
      ))}
    </div>
  );
}