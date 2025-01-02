import { useMemo, useState } from 'react';
import { useHabits } from '../../contexts/HabitContext';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  LightBulbIcon,
  ClockIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { SuccessFailurePattern, useAnalytics } from '../../contexts/AnalyticsContext';
import { isHabitCompletedForDay } from '../../utils/helpers';
import { Habit } from '../../types/habit';

interface BehaviorChainAnalysisProps {
  habitId: string;
}

interface ChainLink {
  type: 'success' | 'failure';
  date: string;
  timeOfDay: string;
  precedingHabits: string[];
  followingHabits: string[];
  dayOfWeek: string;
  streak: number;
}

export default function BehaviorChainAnalysis({ habitId }: BehaviorChainAnalysisProps) {
  const { state: analyticsState } = useAnalytics();
  const { state } = useHabits();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
  const habit = state.habits.find(h => h.id === habitId);

  const chainAnalysis = useMemo(() => {
    if (!habit) return null;

    const today = new Date();
    const startDate = subDays(today, timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90);
    const days = eachDayOfInterval({ start: startDate, end: today });

    // Build behavior chains
    const chains: ChainLink[] = days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const completionValue = habit.completions[dateStr];
      const isCompleted = completionValue !== undefined && isHabitCompletedForDay(habit, completionValue);

      // Find habits completed before and after
      const precedingHabits = state.habits
        .filter(h => {
          if (h.id === habitId) return false;
          const value = h.completions[dateStr];
          return value !== undefined && isHabitCompletedForDay(h, value);
        })
        .map(h => h.name);

      const followingHabits = state.habits
        .filter(h => {
          if (h.id === habitId) return false;
          const value = h.completions[dateStr];
          return value !== undefined && isHabitCompletedForDay(h, value);
        })
        .map(h => h.name);

      return {
        type: isCompleted ? 'success' : 'failure',
        date: dateStr,
        timeOfDay: getTimeOfDay(dateStr),
        precedingHabits,
        followingHabits,
        dayOfWeek: format(date, 'EEEE'),
        streak: calculateStreak(date, habit),
      };
    });

    const patterns = analyticsState.analytics.analytics.at(-1)?.successFailurePatterns[habit.name]?.patterns || [];
    const recommendations = analyticsState.analytics.analytics.at(-1)?.actionableRecommendations[habit.name]?.recommendations || [];

    return {
      chains,
      patterns: { success: patterns.filter(p => p.success), failure: patterns.filter(p => !p.success) },
      recommendations: recommendations,
    };
  }, [habit, state.habits, timeframe]);

  if (!chainAnalysis?.patterns.success.length && !chainAnalysis?.patterns.failure.length && !chainAnalysis?.recommendations.length) return (
    <div className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                        border border-white/20 dark:border-gray-800/30 shadow-xl text-center text-gray-600 dark:text-gray-300 text-lg">
      Track habits for at least 7 days to see patterns and recommendations!
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Success Patterns */}
      {chainAnalysis?.patterns.success.length > 0 && (
        <div className="backdrop-blur-sm bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl p-8 
                      border border-emerald-200/20 dark:border-emerald-800/30 shadow-xl">
          <h3 className="flex items-center text-xl font-bold text-emerald-800 dark:text-emerald-200">
            <CheckCircleIcon className="w-6 h-6 mr-2" />
            Success Patterns
          </h3>
          <div className="mt-6 space-y-4">
            {chainAnalysis.patterns.success.map((pattern, index) => (
              <div key={index} className="bg-white/50 dark:bg-gray-700/70 rounded-xl p-6 
                                      border border-white/20 dark:border-gray-800/30 shadow-lg">
                <PatternCard pattern={pattern} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failure Patterns */}
      {chainAnalysis?.patterns.failure.length > 0 && (
        <div className="backdrop-blur-sm bg-rose-50/50 dark:bg-rose-900/20 rounded-2xl p-8 
                      border border-rose-200/20 dark:border-rose-800/30 shadow-xl">
          <h3 className="flex items-center text-xl font-bold text-rose-800 dark:text-rose-200">
            <XCircleIcon className="w-6 h-6 mr-2" />
            Failure Patterns
          </h3>
          <div className="mt-6 space-y-4">
            {chainAnalysis.patterns.failure.map((pattern, index) => (
              <div key={index} className="bg-white/50 dark:bg-gray-700/70 rounded-xl p-6 
                                      border border-white/20 dark:border-gray-800/30 shadow-lg">
                <PatternCard pattern={pattern} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {chainAnalysis?.recommendations.length > 0 && (
        <div className="backdrop-blur-sm bg-purple-50/50 dark:bg-purple-900/20 rounded-2xl p-8 
                      border border-purple-200/20 dark:border-purple-800/30 shadow-xl">
          <h3 className="flex items-center text-xl font-bold text-purple-800 dark:text-purple-200">
            <LightBulbIcon className="w-6 h-6 mr-2" />
            Actionable Recommendations
          </h3>
          <div className="mt-6 space-y-4">
            {chainAnalysis.recommendations.map((rec, index) => (
              <div key={index} className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6 
                                      border border-white/20 dark:border-gray-800/30 shadow-lg">
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

// Helper functions
function getTimeOfDay(dateStr: string): string {
  const hour = parseISO(dateStr).getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function calculateStreak(date: Date, habit: Habit): number {
  let streak = 0;
  let currentDate = date;
  
  while (true) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const value = habit.completions[dateStr];
    
    if (value === undefined || !isHabitCompletedForDay(habit, value)) {
      break;
    }
    
    streak++;
    currentDate = subDays(currentDate, 1);
  }
  
  return streak;
}