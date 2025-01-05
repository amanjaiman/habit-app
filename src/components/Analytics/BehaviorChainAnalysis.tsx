import { useMemo } from "react";
import { useHabits } from "../../contexts/HabitContext";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  LightBulbIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import {
  SuccessFailurePattern,
  useAnalytics,
} from "../../contexts/AnalyticsContext";
import { CombinedHabit } from "../../types/habit";
import { useGroups } from "../../contexts/GroupContext";

interface BehaviorChainAnalysisProps {
  habitId: string;
}

export default function BehaviorChainAnalysis({
  habitId,
}: BehaviorChainAnalysisProps) {
  const { state: analyticsState } = useAnalytics();
  const { state } = useHabits();
  const { state: groupState } = useGroups();

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

  const habit = allHabits.find((h) => h.id === habitId);

  const behaviorAnalysis = useMemo(() => {
    if (!habit) return null;

    const patterns =
      analyticsState.analytics.analytics.at(-1)?.successFailurePatterns[
        habit.name
      ]?.patterns || [];
    const recommendations =
      analyticsState.analytics.analytics.at(-1)?.actionableRecommendations[
        habit.name
      ]?.recommendations || [];

    return {
      patterns: {
        success: patterns.filter((p) => p.success),
        failure: patterns.filter((p) => !p.success),
      },
      recommendations: recommendations,
    };
  }, [analyticsState.analytics.analytics, habit]);

  if (
    !behaviorAnalysis?.patterns.success.length &&
    !behaviorAnalysis?.patterns.failure.length &&
    !behaviorAnalysis?.recommendations.length
  )
    return (
      <div
        className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                        border border-white/20 dark:border-gray-800/30 shadow-xl text-center text-gray-600 dark:text-gray-300 text-lg"
      >
        Track habits for at least 7 days to see patterns and recommendations!
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Success Patterns */}
      {behaviorAnalysis?.patterns.success.length > 0 && (
        <div
          className="backdrop-blur-sm bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl p-8 
                      border border-emerald-200/20 dark:border-emerald-800/30 shadow-xl"
        >
          <h3 className="flex items-center text-xl font-bold text-emerald-800 dark:text-emerald-200">
            <CheckCircleIcon className="w-6 h-6 mr-2" />
            Success Patterns
          </h3>
          <div className="mt-6 space-y-4">
            {behaviorAnalysis.patterns.success.map((pattern, index) => (
              <div
                key={index}
                className="bg-white/50 dark:bg-gray-700/70 rounded-xl p-6 
                                      border border-white/20 dark:border-gray-800/30 shadow-lg"
              >
                <PatternCard pattern={pattern} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failure Patterns */}
      {behaviorAnalysis?.patterns.failure.length > 0 && (
        <div
          className="backdrop-blur-sm bg-rose-50/50 dark:bg-rose-900/20 rounded-2xl p-8 
                      border border-rose-200/20 dark:border-rose-800/30 shadow-xl"
        >
          <h3 className="flex items-center text-xl font-bold text-rose-800 dark:text-rose-200">
            <XCircleIcon className="w-6 h-6 mr-2" />
            Failure Patterns
          </h3>
          <div className="mt-6 space-y-4">
            {behaviorAnalysis.patterns.failure.map((pattern, index) => (
              <div
                key={index}
                className="bg-white/50 dark:bg-gray-700/70 rounded-xl p-6 
                                      border border-white/20 dark:border-gray-800/30 shadow-lg"
              >
                <PatternCard pattern={pattern} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {behaviorAnalysis?.recommendations.length > 0 && (
        <div
          className="backdrop-blur-sm bg-purple-50/50 dark:bg-purple-900/20 rounded-2xl p-8 
                      border border-purple-200/20 dark:border-purple-800/30 shadow-xl"
        >
          <h3 className="flex items-center text-xl font-bold text-purple-800 dark:text-purple-200">
            <LightBulbIcon className="w-6 h-6 mr-2" />
            Actionable Recommendations
          </h3>
          <div className="mt-6 space-y-4">
            {behaviorAnalysis.recommendations.map((rec, index) => (
              <div
                key={index}
                className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 
                                      border border-white/20 dark:border-gray-800/30 shadow-lg"
              >
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {rec.title}
                </h4>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {rec.description}
                </p>
                <div className="mt-3 flex items-center text-sm text-purple-600 dark:text-purple-400">
                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                  <span>Expected impact: {rec.expected_impact}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PatternCard({ pattern }: { pattern: SuccessFailurePattern }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 dark:text-white">
          {pattern.title}
        </h4>
        <span className="text-sm text-gray-600">
          {pattern.confidence}% confidence
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {pattern.description}
      </p>
      <div className="mt-3 space-y-2">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
          <CalendarIcon className="w-4 h-4 mr-2" />
          {pattern.time_period}
        </div>
      </div>
    </div>
  );
}
