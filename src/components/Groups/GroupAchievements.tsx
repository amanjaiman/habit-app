import { Group } from "../../contexts/GroupContext";
import { motion } from "framer-motion";
import { calculateGroupStreak } from "../../utils/streakCalculations";
import { NumericHabitConfig } from "../../types/habit";

interface GroupAchievementsProps {
  group: Group;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  unlocked: boolean;
  category: "streak" | "completion" | "collaboration";
}

const calculateAchievements = (group: Group): Achievement[] => {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  // Calculate current streak
  const currentStreak = calculateGroupStreak(group);

  // Calculate total completions, only counting valid ones
  const totalCompletions = group.habits.reduce((acc, habit) => {
    const validCompletions =
      habit.completions?.filter((completion) => {
        if (habit.type === "boolean") return completion.completed;
        if (habit.type === "numeric") {
          const config = habit.config as NumericHabitConfig;
          const higherIsBetter = config.higherIsBetter;
          return (
            typeof completion.completed === "number" &&
            (higherIsBetter
              ? completion.completed >= config.goal
              : completion.completed <= config.goal)
          );
        }
        if (habit.type === "rating") {
          return (
            typeof completion.completed === "number" &&
            completion.completed >= (habit.config?.goal || 0)
          );
        }
        return false;
      }).length || 0;

    return acc + validCompletions;
  }, 0);

  // Progressive completion targets
  let completionProgress = totalCompletions;
  let completionTarget = 100;
  let completionTitle = "Century Club";
  let completionDescription = "Group reached 100 total habit completions";

  if (totalCompletions >= 1000) {
    completionTarget = 1000;
    completionTitle = "Millennium Milestone";
    completionDescription = "Group reached 1000 total habit completions";
  } else if (totalCompletions >= 500) {
    completionTarget = 500;
    completionTitle = "High Five Hundred";
    completionDescription = "Group reached 500 total habit completions";
  }

  // Progressive streak targets
  let streakTarget = 7;
  let streakTitle = "Perfect Week";
  let streakDescription =
    "All members completed their habits for 7 days straight";

  if (currentStreak >= 30) {
    streakTarget = 30;
    streakTitle = "Perfect Month";
    streakDescription =
      "All members completed their habits for 30 days straight";
  }

  // Check if all members completed habits today
  const todayStr = today.toISOString().split("T")[0];
  const allCompletedToday = group.habits.every((habit) =>
    group.memberDetails.every((member) =>
      habit.completions?.some(
        (completion) =>
          completion.userId === member.id &&
          completion.date.split("T")[0] === todayStr
      )
    )
  );

  return [
    {
      id: 1,
      title: streakTitle,
      description: streakDescription,
      icon: "🌟",
      progress: currentStreak,
      target: streakTarget,
      unlocked: currentStreak >= streakTarget,
      category: "streak",
    },
    {
      id: 2,
      title: completionTitle,
      description: completionDescription,
      icon: "💯",
      progress: completionProgress,
      target: completionTarget,
      unlocked: totalCompletions >= completionTarget,
      category: "completion",
    },
    {
      id: 3,
      title: "Team Spirit",
      description: "All members completed habits on the same day",
      icon: "🤝",
      progress: allCompletedToday ? 1 : 0,
      target: 1,
      unlocked: allCompletedToday,
      category: "collaboration",
    },
    // Add more achievements with real calculations
  ];
};

export default function GroupAchievements({ group }: GroupAchievementsProps) {
  const achievements = calculateAchievements(group);

  const categoryColors = {
    streak: "from-yellow-500 to-orange-500",
    completion: "from-blue-500 to-purple-500",
    collaboration: "from-green-500 to-teal-500",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            whileHover={{ scale: 1.02 }}
            className={`p-6 rounded-xl border 
              ${
                achievement.unlocked
                  ? `bg-gradient-to-r ${categoryColors[achievement.category]} 
                   bg-opacity-20 dark:bg-opacity-10 
                   border-transparent text-white dark:text-white`
                  : "bg-white/30 dark:bg-gray-800/30 border-white/20 dark:border-gray-700/30"
              } 
              backdrop-blur-sm shadow-lg`}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{achievement.icon}</span>
              <div>
                <h3
                  className={`font-bold ${
                    achievement.unlocked
                      ? "text-white dark:text-white"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {achievement.title}
                </h3>
                <p
                  className={`text-sm ${
                    achievement.unlocked
                      ? "text-white/90 dark:text-white/90"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {achievement.description}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div
                className={`flex justify-between text-sm ${
                  achievement.unlocked
                    ? "text-white/90 dark:text-white/90"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                <span>Progress</span>
                <span>
                  {achievement.progress}/{achievement.target}
                </span>
              </div>
              <div
                className={`h-2 rounded-full ${
                  achievement.unlocked
                    ? "bg-white/20 dark:bg-white/10"
                    : "bg-gray-200 dark:bg-gray-700"
                } overflow-hidden`}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      (achievement.progress / achievement.target) * 100
                    }%`,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    achievement.unlocked
                      ? "bg-white"
                      : `bg-gradient-to-r ${
                          categoryColors[achievement.category]
                        }`
                  }`}
                />
              </div>
            </div>

            {achievement.unlocked && (
              <div className="mt-4 flex items-center gap-2 text-sm text-green-500 dark:text-green-400">
                <span>✓</span>
                <span>Unlocked!</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
