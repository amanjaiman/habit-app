import { Group } from '../../contexts/GroupContext';
import { motion } from 'framer-motion';
import { calculateMemberStreak } from '../../utils/streakCalculations';

interface GroupLeaderboardProps {
  group: Group;
}

interface MemberStats {
  id: string;
  name: string;
  avatar?: string;
  completionRate: number;
  streak: number;
  totalCompletions: number;
  lastActive: Date;
}

export default function GroupLeaderboard({ group }: GroupLeaderboardProps) {
  const calculateMemberStats = (): MemberStats[] => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return group.memberDetails.map(member => {
      // Calculate completion rate for last 30 days
      const possibleCompletions = group.habits.length * 30;
      const actualCompletions = group.habits.reduce((acc, habit) => {
        return acc + (habit.completions?.filter(completion =>
          completion.userId === member.id &&
          new Date(completion.date) >= thirtyDaysAgo
        ).length || 0);
      }, 0);

      // Calculate member's current streak
      const streak = calculateMemberStreak(member.id, group);

      // Calculate total completions
      const totalCompletions = group.habits.reduce((acc, habit) => {
        return acc + (habit.completions?.filter(completion =>
          completion.userId === member.id
        ).length || 0);
      }, 0);

      // Get last active date
      const lastCompletion = group.habits
        .flatMap(habit => habit.completions || [])
        .filter(completion => completion.userId === member.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      return {
        id: member.id,
        name: member.name,
        avatar: member.profileImage,
        completionRate: Math.round((actualCompletions / possibleCompletions) * 100),
        streak,
        totalCompletions,
        lastActive: lastCompletion ? new Date(lastCompletion.date) : new Date()
      };
    });
  };

  const members = calculateMemberStats().sort((a, b) => b.completionRate - a.completionRate);

  const getPositionStyle = (index: number) => {
    if (index === 0) return 'bg-yellow-500';
    if (index === 1) return 'bg-gray-400';
    if (index === 2) return 'bg-amber-600';
    return 'bg-gray-200 dark:bg-gray-700';
  };

  return (
    <div className="space-y-4">
      {members.map((member, index) => (
        <motion.div
          key={member.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="flex items-center justify-between p-4 rounded-xl 
                    bg-white/50 dark:bg-gray-800/50 
                    hover:bg-white/70 dark:hover:bg-gray-700/70 
                    border border-white/20 dark:border-gray-700/30
                    transition-colors duration-200"
        >
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                          text-white font-bold ${getPositionStyle(index)}`}>
              {index + 1}
            </div>
            
            <div className="flex items-center gap-3">
              {member.avatar && (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-10 h-10 rounded-full ring-2 ring-white/20 dark:ring-gray-700/30"
                />
              )}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {member.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last active: {member.lastActive.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Completion</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {member.completionRate}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Streak</p>
              <p className="font-bold text-gray-900 dark:text-white">
                🔥 {member.streak}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {member.totalCompletions}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
} 