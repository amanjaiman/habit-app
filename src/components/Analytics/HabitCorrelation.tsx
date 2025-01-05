import { useMemo } from "react";
import { useHabits } from "../../contexts/HabitContext";
import { format, eachDayOfInterval, subMonths } from "date-fns";
import { LightBulbIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useAnalytics } from "../../contexts/AnalyticsContext";
import { useGroups } from "../../contexts/GroupContext";
import { CombinedHabit } from "../../types/habit";

interface HabitCorrelationProps {
  habitId: string;
}

export default function HabitCorrelation({ habitId }: HabitCorrelationProps) {
  const { state: analyticsState } = useAnalytics();
  const { state } = useHabits();
  const { state: groupState } = useGroups();
  const today = new Date();
  const startDate = subMonths(today, 3);

  const allHabits = useMemo<CombinedHabit[]>(() => {
    const personalHabits = state.habits;
    const groupHabits = groupState.groups.flatMap((group) =>
      group.habits.map(
        (habit) =>
          ({
            ...habit,
            isGroupHabit: true,
            groupName: group.name,
            groupId: group.id,
          } as CombinedHabit)
      )
    );
    return [...personalHabits, ...groupHabits];
  }, [state.habits, groupState.groups]);

  const correlationData = useMemo(() => {
    if (habitId === "all" || !habitId) return [];

    const targetHabit = allHabits.find((h) => h.id === habitId);
    if (!targetHabit) return [];

    const latestAnalytics = analyticsState.analytics.analytics.at(-1);

    if (
      !latestAnalytics ||
      !latestAnalytics.correlationInsights[targetHabit.name]
    )
      return [];

    const habitCorrelations =
      latestAnalytics?.correlationInsights[targetHabit.name].correlations || [];

    const days = eachDayOfInterval({ start: startDate, end: today });
    const otherHabits = allHabits.filter((h) => h.id !== habitId);

    return otherHabits
      .map((habit) => {
        // Calculate basic correlation
        let sameDay = 0;
        let oppositeDay = 0;
        let totalDays = 0;
        let timeProximitySum = 0;
        let conflicts = 0;
        let successes = 0;

        days.forEach((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const targetCompleted =
            "isGroupHabit" in targetHabit
              ? targetHabit.completions.some((c) => c.date === dateStr)
              : targetHabit.completions[dateStr];
          const habitCompleted =
            "isGroupHabit" in habit
              ? habit.completions.some((c) => c.date === dateStr)
              : habit.completions[dateStr];

          if (targetCompleted && habitCompleted) {
            sameDay++;
            // Calculate time proximity if we had timestamp data
            // For now, using a random value for demonstration
            timeProximitySum += Math.random() * 24;
            successes++;
          } else if (!targetCompleted && !habitCompleted) {
            sameDay++;
          } else if (targetCompleted || habitCompleted) {
            oppositeDay++;
            if (targetCompleted && habitCompleted) conflicts++;
          }
          totalDays++;
        });

        const correlationScore = ((sameDay - oppositeDay) / totalDays) * 100;
        const timeProximity = timeProximitySum / (sameDay || 1);
        const successRate = (successes / totalDays) * 100;
        const conflictRate = (conflicts / totalDays) * 100;

        // Generate insights based on the data
        const insights =
          habitCorrelations.find((c) => c.correlating_habit === habit.name)
            ?.insights || [];

        // Generate recommendations
        const recommendations =
          habitCorrelations.find((c) => c.correlating_habit === habit.name)
            ?.recommendations || [];

        return {
          habitId: habit.id,
          habitName: habit.name,
          emoji: habit.emoji,
          correlationScore,
          timeProximity,
          successRate,
          conflictRate,
          insights,
          recommendations,
        };
      })
      .sort(
        (a, b) => Math.abs(b.correlationScore) - Math.abs(a.correlationScore)
      );
  }, [
    habitId,
    allHabits,
    analyticsState.analytics.analytics,
    startDate,
    today,
  ]);

  if (!correlationData.length) {
    return (
      <div
        className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                        border border-white/20 dark:border-gray-800/30 shadow-xl text-center text-gray-600 dark:text-gray-300 text-lg"
      >
        Track habits for at least 7 days to see correlations!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Correlation Matrix */}
      <div
        className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                    border border-white/20 dark:border-gray-800/30 shadow-xl"
      >
        <h3
          className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                     dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text mb-6"
        >
          Habit Correlations
        </h3>
        <div className="grid grid-cols-1 gap-6">
          {correlationData.map((correlation) => (
            <div
              key={correlation.habitId}
              className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 
                       border border-white/20 dark:border-gray-800/30 shadow-lg 
                       hover:shadow-xl transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{correlation.emoji}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {correlation.habitName}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    correlation.correlationScore > 65
                      ? "bg-green-100/50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : correlation.correlationScore > 50
                      ? "bg-yellow-100/50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                      : "bg-gray-100/50 dark:bg-gray-900/30 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {correlation.correlationScore.toFixed(1)}% correlation
                </span>
              </div>

              {/* Insights */}
              {correlation.insights.length > 0 && (
                <div className="mt-4 space-y-2">
                  {correlation.insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <LightBulbIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {insight}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {correlation.recommendations.length > 0 && (
                <div className="mt-4 bg-sky-100/60 dark:bg-gray-700/30 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Recommendations
                  </h5>
                  <div className="space-y-2">
                    {correlation.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
