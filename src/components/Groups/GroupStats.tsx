import { Group } from "../../contexts/GroupContext";
import { calculateGroupStreak } from "../../utils/streakCalculations";

interface GroupStatsProps {
  group: Group;
}

export default function GroupStats({ group }: GroupStatsProps) {
  const calculateStats = () => {
    // Get the last 30 days for calculations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find the earliest completion date across all habits
    const firstCompletionDate = group.habits.reduce((earliest, habit) => {
      const habitEarliest = habit.completions?.reduce((acc, completion) => {
        const completionDate = new Date(completion.date);
        return completionDate < acc ? completionDate : acc;
      }, new Date());
      return habitEarliest < earliest ? habitEarliest : earliest;
    }, new Date());

    // Use the later date between thirtyDaysAgo and firstCompletionDate
    const startDate =
      firstCompletionDate > thirtyDaysAgo ? firstCompletionDate : thirtyDaysAgo;

    // Calculate days since start date (minimum 1 day)
    const today = new Date();
    const daysSinceStart = Math.max(
      1,
      Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Calculate completion rate based on the determined time period
    const possibleCompletions =
      group.habits.length * group.memberDetails.length * daysSinceStart;
    const totalCompletions = group.habits.reduce((acc, habit) => {
      return (
        acc +
        (habit.completions?.filter(
          (completion) => new Date(completion.date) >= startDate
        ).length || 0)
      );
    }, 0);
    const completionRate = (totalCompletions / possibleCompletions) * 100;

    // Calculate active members (completed any habit in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeMembers = group.memberDetails.filter((member) => {
      return group.habits.some((habit) =>
        habit.completions?.some(
          (completion) =>
            completion.userId === member.id &&
            new Date(completion.date) >= sevenDaysAgo
        )
      );
    }).length;

    return {
      completionRate: Math.round(completionRate),
      currentStreak: calculateGroupStreak(group),
      totalCompletions,
      activeMembers,
    };
  };

  const stats = calculateStats();

  const statCards = [
    {
      label: "30-Day Completion Rate",
      value: `${stats.completionRate}%`,
      icon: "📊",
    },
    {
      label: "Current Streak",
      value: `${stats.currentStreak} days`,
      icon: "🔥",
    },
    {
      label: "Total Completions",
      value: stats.totalCompletions,
      icon: "✅",
    },
    {
      label: "Active Members",
      value: `${stats.activeMembers}/${group.memberDetails.length}`,
      icon: "👥",
    },
  ];

  return (
    <div className="flex gap-1.5">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-lg p-4 
                    border border-white/20 dark:border-gray-800/30 shadow-lg
                    transform transition-transform duration-200"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{stat.icon}</span>
            <h3 className="text-xs text-gray-500 dark:text-gray-400">
              {stat.label}
            </h3>
          </div>
          <p className="text-xl font-bold mt-1 text-gray-900 dark:text-white">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
