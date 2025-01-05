import { useCallback, useMemo, useState } from "react";
import { useHabits } from "../../contexts/HabitContext";
import {
  format,
  eachDayOfInterval,
  subDays,
  getDay,
  parseISO,
  differenceInDays,
  startOfYear,
} from "date-fns";
import {
  ChartBarIcon,
  SparklesIcon,
  CalendarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  FireIcon,
  SunIcon,
  LightBulbIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  CombinedHabit,
  Habit,
  HabitCompletionValue,
  HabitType,
  NumericHabitConfig,
  RatingHabitConfig,
} from "../../types/habit";
import { Link } from "react-router-dom";
import { KeyInsight, useAnalytics } from "../../contexts/AnalyticsContext";
import TrendChart from "./TrendChart";
import { useUser } from "../../contexts/UserContext";
import { useUserPremium } from "../../hooks/useUserPremium";
import { GroupHabit } from "../../contexts/GroupContext";
import { useGroups } from "../../contexts/GroupContext";

interface AnalyticsSummaryProps {
  habitId: string;
}

type CompletionPeriod = "lifetime" | "year" | "twoWeeks";

// Add these interfaces near the top of the file, after the imports
interface CompletionRatePeriod {
  rate: number;
  label: string;
}

interface StatPeriods {
  lifetime: CompletionRatePeriod;
  year: CompletionRatePeriod;
  twoWeeks: CompletionRatePeriod;
}

interface BaseStat {
  name: string;
  value: string;
  icon: any; // Or use the proper HeroIcon type if available
  description: string;
  trend?: "up" | "down";
  details?: string;
}

interface PrimaryStat extends BaseStat {
  isPeriodToggleable?: boolean;
  periods?: StatPeriods;
}

interface SecondaryStat extends BaseStat {
  alert?: boolean;
}

interface AnalyticsStats {
  title: string;
  primaryStats: PrimaryStat[];
  secondaryStats: SecondaryStat[];
  insights: KeyInsight[];
}

// Add type guard to check if a habit is a group habit
function isGroupHabit(habit: Habit | GroupHabit): habit is GroupHabit {
  return "completions" in habit && Array.isArray(habit.completions);
}

// Helper to get completion value for a habit (either group or individual)
function getHabitCompletionForDay(
  habit: Habit | GroupHabit,
  dateStr: string,
  userId?: string
): HabitCompletionValue | undefined {
  if (isGroupHabit(habit)) {
    const completion = habit.completions.find(
      (c) => c.date === dateStr && c.userId === userId
    );
    return completion?.completed;
  }
  return habit.completions[dateStr];
}

export default function AnalyticsSummary({ habitId }: AnalyticsSummaryProps) {
  const { state: userState } = useUser();
  const userId = userState.profile?.id;
  const { state: analyticsState } = useAnalytics();
  const { premium } = useUserPremium();
  const latestAnalytics = analyticsState.analytics.analytics.at(-1);
  const { state } = useHabits();
  const { state: groupState } = useGroups();
  const today = new Date();

  // Add this to combine personal and group habits
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

  const [selectedPeriods, setSelectedPeriods] = useState<
    Record<string, CompletionPeriod>
  >({});
  const [currentInsightPage, setCurrentInsightPage] = useState(0);

  const getKeyInsights = useCallback(
    (habitName: string | "all") => {
      if (!latestAnalytics) return [];

      if (habitName === "all") {
        return (
          latestAnalytics?.keyInsights.insights.sort(
            (a, b) => b.score - a.score
          ) || []
        );
      }
      return (
        latestAnalytics?.individualHabitKeyInsights[habitName]?.insights.sort(
          (a, b) => b.score - a.score
        ) || []
      );
    },
    [latestAnalytics]
  );

  const stats = useMemo((): AnalyticsStats | null => {
    const last90Days = eachDayOfInterval({
      start: subDays(today, 90),
      end: today,
    });

    const dailyCompletionRates = last90Days.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const completedCount = allHabits.filter((habit) => {
        const completion = getHabitCompletionForDay(habit, dateStr, userId);
        return completion;
      }).length;

      return {
        date,
        rate: (completedCount / allHabits.length) * 100,
        completedCount,
      };
    });

    if (habitId === "all") {
      // Calculate WoW momentum instead of 30-day
      const thisWeek = dailyCompletionRates.slice(-7);
      const lastWeek = dailyCompletionRates.slice(-14, -7);
      const thisWeekAvg =
        thisWeek.reduce((sum, d) => sum + d.rate, 0) / thisWeek.length;
      const lastWeekAvg =
        lastWeek.reduce((sum, d) => sum + d.rate, 0) / lastWeek.length;
      const weeklyMomentum = ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100;

      // Replace peak performance with habit diversity score
      const habitDiversity = calculateHabitDiversity(allHabits);

      // Calculate advanced metrics
      const volatility = calculateVolatility(
        dailyCompletionRates.map((d) => d.rate),
        true
      );
      const consistency = calculateConsistencyScore(dailyCompletionRates);
      const habitSynergy = calculateHabitSynergy(allHabits, userId);

      // Peak Performance Analysis
      const burnoutRisk = calculateBurnoutRisk(dailyCompletionRates);

      return {
        title: "Advanced Analytics Overview",
        primaryStats: [
          {
            name: "Habit Consistency Score",
            value: `${consistency.toFixed(1)}`,
            icon: SparklesIcon,
            description: "Based on pattern recognition and variance analysis",
            trend: consistency > 75 ? "up" : "down",
            details: `${
              consistency > 75 ? "Strong" : "Developing"
            } habit patterns detected`,
          },
          {
            name: "Current Momentum",
            value: `${weeklyMomentum.toFixed(1)}%`,
            icon: ArrowTrendingUpIcon,
            description: "Change from previous week",
            trend: weeklyMomentum > 0 ? "up" : "down",
            details:
              weeklyMomentum > 0
                ? "Positive trajectory"
                : "Room for improvement",
          },
          {
            name: "Habit Diversity",
            value: `${habitDiversity.score.toFixed(1)}`,
            icon: SparklesIcon,
            description: `${habitDiversity.categories} life areas covered`,
            trend: habitDiversity.score > 70 ? "up" : "down",
            details: habitDiversity.recommendation,
          },
        ],
        secondaryStats: [
          {
            name: "Stability",
            value: `${(100 - volatility).toFixed(1)}%`,
            icon: BoltIcon,
            description: "How consistent your completion rate is day-to-day",
          },
          {
            name: "Habit Synergy",
            value: `${habitSynergy.score.toFixed(1)}%`,
            icon: FireIcon,
            description: `${habitSynergy.complementaryHabits} complementary habit pairs identified`,
          },
          {
            name: "Burnout Risk",
            value: burnoutRisk.level,
            icon: ChartBarIcon,
            description: burnoutRisk.recommendation,
            alert: burnoutRisk.level === "High",
          },
        ],
        insights: getKeyInsights("all"),
      };
    } else {
      const habit = allHabits.find((h) => h.id === habitId);
      if (!habit) return null;

      // For numeric and rating habits, calculate average and best values
      let performanceStats: PrimaryStat | null = null;
      if (habit.type === HabitType.NUMERIC || habit.type === HabitType.RATING) {
        let values: number[] = [];

        if (isGroupHabit(habit)) {
          values = habit.completions
            .filter(
              (c) => c.userId === userId && typeof c.completed === "number"
            )
            .map((c) => c.completed as number);
        } else {
          values = Object.values(habit.completions).filter(
            (v) => typeof v === "number"
          ) as number[];
        }

        if (values.length > 0) {
          const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
          const best =
            habit.type === HabitType.NUMERIC
              ? (habit.config as NumericHabitConfig).higherIsBetter
                ? Math.max(...values)
                : Math.min(...values)
              : Math.max(...values);
          const unit =
            habit.type === HabitType.NUMERIC
              ? (habit.config as NumericHabitConfig).unit
              : "";

          const details =
            habit.type === HabitType.NUMERIC
              ? `Best: ${best} ${unit}`
              : avg >= (habit.config as RatingHabitConfig).max * 0.8
              ? `You're crushing it!`
              : `Keep at it!`;

          performanceStats = {
            name: "Performance",
            value: `${avg.toFixed(1)} ${unit}`,
            icon: ChartBarIcon,
            description: `Average ${
              habit.type === HabitType.RATING ? "rating" : "value"
            }`,
            trend:
              avg >=
              (habit.type === HabitType.NUMERIC
                ? (habit.config as NumericHabitConfig).goal
                : (habit.config as RatingHabitConfig).max * 0.8)
                ? "up"
                : "down",
            details: details,
          };
        }
      }

      // Get completion dates for the habit
      const completionDates = isGroupHabit(habit)
        ? habit.completions
            .filter((c) => c.userId === userId && c.completed)
            .map((c) => parseISO(c.date))
        : Object.entries(habit.completions)
            .filter(([_, completed]) => completed)
            .map(([date]) => parseISO(date));

      // Calculate daily completion rates for the habit
      const last90Days = eachDayOfInterval({
        start: subDays(today, 90),
        end: today,
      });

      const dailyCompletionRates = last90Days.map((date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const completed = getHabitCompletionForDay(habit, dateStr, userId);
        return {
          date,
          rate: completed ? 100 : 0,
        };
      });

      // Calculate week-over-week momentum
      const thisWeek = dailyCompletionRates.slice(-7);
      const lastWeek = dailyCompletionRates.slice(-14, -7);
      const thisWeekAvg =
        thisWeek.reduce((sum, d) => sum + d.rate, 0) / thisWeek.length;
      const lastWeekAvg =
        lastWeek.reduce((sum, d) => sum + d.rate, 0) / lastWeek.length;
      const weeklyMomentum = ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100;

      // Calculate completion rates for different periods
      const firstCompletionDate =
        completionDates.length > 0
          ? completionDates.reduce((a, b) => (a < b ? a : b))
          : new Date();

      const getCompletionRate = (period: CompletionPeriod) => {
        let startDate = new Date();
        let endDate = new Date();
        let label = "";

        switch (period) {
          case "lifetime":
            startDate = firstCompletionDate;
            label = `Since tracking on HabitAI`;
            break;
          case "year":
            startDate = startOfYear(new Date());
            label = `This year`;
            break;
          case "twoWeeks":
            startDate = subDays(new Date(), 14);
            label = "Last two weeks";
            break;
        }

        const daysInPeriod = differenceInDays(endDate, startDate) + 1;
        const completionsInPeriod = completionDates.filter(
          (date) => date >= startDate && date <= endDate
        ).length;

        return {
          rate: (completionsInPeriod / daysInPeriod) * 100,
          label,
        };
      };

      const completionRates = {
        lifetime: getCompletionRate("lifetime"),
        year: getCompletionRate("year"),
        twoWeeks: getCompletionRate("twoWeeks"),
      };

      const streakAnalysis = analyzeStreakPatterns(completionDates, habit);
      const timeAnalysis = analyzeTimePatterns(completionDates);

      return {
        title: `Analytics for ${habit.name}`,
        primaryStats: [
          {
            name: "Current Streak",
            value: `${streakAnalysis.currentStreak} days`,
            icon: FireIcon,
            description: `Best streak: ${streakAnalysis.bestStreak} days`,
            trend: streakAnalysis.currentStreak > 0 ? "up" : "down",
            details: streakAnalysis.streakQuality,
          },
          // Replace momentum with performance stats for numeric/rating habits
          performanceStats || {
            name: "Current Momentum",
            value: `${weeklyMomentum.toFixed(1)}%`,
            icon: ArrowTrendingUpIcon,
            description: "Change from previous week",
            trend: weeklyMomentum > 0 ? "up" : "down",
            details:
              weeklyMomentum > 0
                ? "Positive trajectory"
                : "Room for improvement",
          },
          {
            name: "Completion Rate",
            value: `${completionRates.lifetime.rate.toFixed(1)}%`,
            icon: ChartBarIcon,
            description: completionRates.lifetime.label,
            trend: completionRates.lifetime.rate > 70 ? "up" : "down",
            details:
              completionRates.lifetime.rate > 70
                ? "Strong completion rate"
                : "Room for improvement",
            periods: completionRates,
            isPeriodToggleable: true,
          },
        ],
        secondaryStats: [
          {
            name: "Stability",
            value: `${calculateVolatility(
              dailyCompletionRates.map((d) => d.rate)
            )}%`,
            icon: BoltIcon,
            description: "How consistently you complete this habit in a week",
          },
          {
            name: "Best Day",
            value: timeAnalysis.optimalDay,
            icon: CalendarIcon,
            description: `${timeAnalysis.daySuccessRate}% success rate on this day`,
          },
          {
            name: "Recovery Rate",
            value: `${streakAnalysis.recoveryRate}%`,
            icon: BoltIcon,
            description: "How quickly you restart after missing a day",
          },
        ],
        insights: getKeyInsights(habit.name),
      };
    }
  }, [today, habitId, allHabits, userId, getKeyInsights]);

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.primaryStats.map((stat, index) => (
          <div
            key={index}
            className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-6 
                   border border-white/20 dark:border-gray-800/30 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <stat.icon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <h3 className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                  {stat.name}
                </h3>
                {stat.isPeriodToggleable && (
                  <div className="flex gap-1 ml-3">
                    <button
                      onClick={() =>
                        setSelectedPeriods((prev) => ({
                          ...prev,
                          [index]: "twoWeeks",
                        }))
                      }
                      className={`p-1.5 rounded-lg transition-all ${
                        (selectedPeriods[index] || "lifetime") === "twoWeeks"
                          ? "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400"
                          : "hover:bg-white/50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300"
                      }`}
                      title="Last two weeks"
                    >
                      <ClockIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedPeriods((prev) => ({
                          ...prev,
                          [index]: "year",
                        }))
                      }
                      className={`p-1.5 rounded-lg transition-all ${
                        (selectedPeriods[index] || "lifetime") === "year"
                          ? "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400"
                          : "hover:bg-white/50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300"
                      }`}
                      title="This year"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedPeriods((prev) => ({
                          ...prev,
                          [index]: "lifetime",
                        }))
                      }
                      className={`p-1.5 rounded-lg transition-all ${
                        (selectedPeriods[index] || "lifetime") === "lifetime"
                          ? "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400"
                          : "hover:bg-white/50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-300"
                      }`}
                      title="Lifetime"
                    >
                      <SunIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              {stat.trend && (
                <span
                  className={`text-sm font-medium px-2 py-1 rounded-full ${
                    stat.trend === "up"
                      ? "bg-green-100/50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : "bg-rose-100/50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {stat.trend === "up" ? "↑" : "↓"}
                </span>
              )}
            </div>
            <div className="mt-4">
              {stat.isPeriodToggleable ? (
                <p
                  className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                              dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
                >
                  {stat.periods?.[
                    selectedPeriods[index] || "lifetime"
                  ].rate.toFixed(1)}
                  %
                </p>
              ) : (
                <p
                  className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                           dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
                >
                  {stat.value}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {stat.isPeriodToggleable
                  ? stat.periods?.[selectedPeriods[index] || "lifetime"].label
                  : stat.description}
              </p>
              {stat.details && (
                <p className="mt-2 text-sm text-purple-600 dark:text-purple-400 font-medium">
                  {stat.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="relative space-y-8">
        {/* Secondary Stats - add premium gate */}
        <div className="relative">
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${
              !premium && "blur-sm pointer-events-none"
            }`}
          >
            {stats.secondaryStats.map((stat, index) => (
              <div
                key={index}
                className={`backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-xl p-6 
                        border border-white/20 dark:border-gray-800/30 shadow-lg 
                        hover:shadow-xl transition-all duration-200
                        ${
                          stat.alert
                            ? "border-l-4 border-rose-500 dark:border-rose-400"
                            : ""
                        }`}
              >
                <div className="flex items-center">
                  <stat.icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stat.name}
                  </span>
                </div>
                <p
                  className="mt-2 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 
                          dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Insights - add premium gate */}
        {stats.insights.length > 0 && (
          <div className="relative">
            <div
              className={`backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                            border border-white/20 dark:border-gray-800/30 shadow-xl
                            ${!premium && "blur-sm pointer-events-none"}`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3
                  className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                              dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
                >
                  Personalized Insights
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentInsightPage((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentInsightPage === 0}
                    className="p-1 rounded-lg transition-all hover:bg-white/50 dark:hover:bg-gray-800/50
                              disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <div className="flex w-max text-sm text-gray-600 dark:text-gray-300">
                    {currentInsightPage + 1} /{" "}
                    {Math.ceil(stats.insights.length / 3)}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentInsightPage((prev) =>
                        Math.min(
                          Math.ceil(stats.insights.length / 3) - 1,
                          prev + 1
                        )
                      )
                    }
                    disabled={
                      currentInsightPage >=
                      Math.ceil(stats.insights.length / 3) - 1
                    }
                    className="p-1 rounded-lg transition-all hover:bg-white/50 dark:hover:bg-gray-800/50
                              disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {stats.insights
                  .slice(currentInsightPage * 3, (currentInsightPage + 1) * 3)
                  .map((insight, index) => (
                    <div
                      key={index}
                      className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-5 
                                  border border-white/20 dark:border-gray-800/30 shadow-lg 
                                  hover:shadow-xl transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:space-x-4">
                        <div className="flex-shrink-0">
                          <div
                            className="w-8 md:w-10 h-8 md:h-10 rounded-xl flex items-center justify-center 
                                      backdrop-blur-sm bg-gradient-to-br shadow-inner"
                            style={{
                              backgroundColor: `rgba(${
                                insight.score
                              }, ${Math.min(
                                insight.score * 2,
                                200
                              )}, ${Math.min(insight.score * 3, 255)}, 0.1)`,
                            }}
                          >
                            <span
                              className="text-sm md:text-md font-bold"
                              style={{
                                color: `rgb(${insight.score}, ${Math.min(
                                  insight.score * 2,
                                  200
                                )}, ${Math.min(insight.score * 3, 255)})`,
                              }}
                            >
                              {insight.score}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mt-3 md:mt-0">
                            <h4 className="text-base font-medium text-gray-900 dark:text-white">
                              {insight.title}
                            </h4>
                            <span
                              className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                                insight.polarity === "positive"
                                  ? "bg-green-100/50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                  : "bg-rose-100/50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              <div className="sm:hidden">
                                {insight.polarity === "positive" ? "↑" : "↓"}
                              </div>
                              <div className="hidden sm:flex">
                                {insight.polarity === "positive"
                                  ? "↑ Positive"
                                  : "↓ Needs Focus"}
                              </div>
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            {insight.description}
                          </p>
                          {insight.explanation && (
                            <div className="mt-4 relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-lg" />
                              <div className="relative backdrop-blur-sm rounded-lg border border-purple-200/50 dark:border-purple-700/30">
                                <div className="px-4 py-3">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <LightBulbIcon className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                      Key Insight
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {insight.explanation}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
        {stats.insights.length === 0 && (
          <div
            className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
          border border-white/20 dark:border-gray-800/30 shadow-xl text-center text-gray-600 dark:text-gray-300 text-lg"
          >
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">
              AI is analyzing your habits. Insights will be published every
              Monday!
            </span>
          </div>
        )}

        {premium && <TrendChart habitId={habitId} />}

        {/* Single Premium Gate */}
        {!premium && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-white/95 dark:bg-gray-900/95 rounded-xl p-6 shadow-xl border border-purple-200 dark:border-purple-900">
              <SparklesIcon className="w-8 h-8 text-purple-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Premium Analytics
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Upgrade to unlock detailed analytics, insights, and personalized
                recommendations
              </p>
              <Link
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                to="/settings"
              >
                Upgrade to Premium
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions for advanced analytics
function calculateVolatility(
  rates: number[],
  isAllHabits: boolean = false
): number {
  if (rates.length < 5) return 0;

  if (isAllHabits) {
    // For all habits: Calculate std dev of daily completion rates
    const mean = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const squaredDiffs = rates.map((rate) => Math.pow(rate - mean, 2));
    const stdDev = Math.sqrt(
      squaredDiffs.reduce((sum, diff) => sum + diff, 0) / rates.length
    );

    // Convert to stability score (0-100)
    // A std dev of 0 = perfect stability (100%)
    // A std dev of 30 or more = low stability (0%)
    const stabilityScore = Math.max(0, Math.min(100, 100 - stdDev * 3.33));
    return Math.round(stabilityScore);
  } else {
    // For individual habits: Look at completion count in rolling 7-day windows
    const last4Weeks = rates.slice(-28); // Get last 28 days (4 weeks)
    const windows = [];
    for (let i = 0; i <= last4Weeks.length - 7; i++) {
      const windowRates = last4Weeks.slice(i, i + 7);
      const completionsInWindow = windowRates.filter(
        (rate) => rate === 100
      ).length;
      windows.push(completionsInWindow);
    }

    const mean =
      windows.reduce((sum, count) => sum + count, 0) / windows.length;
    const squaredDiffs = windows.map((count) => Math.pow(count - mean, 2));
    const stdDev = Math.sqrt(
      squaredDiffs.reduce((sum, diff) => sum + diff, 0) / windows.length
    );

    // Convert to stability score (0-100)
    // A std dev of 0 = perfect stability (100%)
    // A std dev of 3.5 or more = low stability (0%)
    // Adjusted multiplier since we're using 7-day windows
    const stabilityScore = Math.max(0, Math.min(100, 100 - stdDev * 28.57));
    return Math.round(stabilityScore);
  }
}

function calculateConsistencyScore(
  data: { rate: number; date: Date }[]
): number {
  if (data.length < 7) return 0;

  // Calculate rolling 7-day averages
  const weeklyAverages = [];
  for (let i = 6; i < data.length; i++) {
    const weekData = data.slice(i - 6, i + 1);
    const avg = weekData.reduce((sum, d) => sum + d.rate, 0) / 7;
    weeklyAverages.push(avg);
  }

  // Calculate components of consistency score

  // 1. Pattern Stability (40% of score)
  const stabilityScore = calculateVolatility(weeklyAverages, true);

  // 2. Completion Level (30% of score)
  const avgCompletion = data.reduce((sum, d) => sum + d.rate, 0) / data.length;
  const completionScore = Math.min(100, avgCompletion);

  // 3. Trend Consistency (30% of score)
  const trendScore = calculateTrendConsistency(weeklyAverages);

  // Weighted average of components
  const finalScore =
    stabilityScore * 0.4 + completionScore * 0.3 + trendScore * 0.3;

  return Math.round(finalScore);
}

// Helper function to calculate trend consistency
function calculateTrendConsistency(averages: number[]): number {
  if (averages.length < 2) return 0;

  // Calculate week-over-week changes
  const changes = [];
  for (let i = 1; i < averages.length; i++) {
    const change = averages[i] - averages[i - 1];
    changes.push(Math.abs(change));
  }

  // Lower average change indicates more consistent trend
  const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;

  // Convert to 0-100 score (20% change or more = 0, 0% change = 100)
  return Math.max(0, 100 - avgChange * 5);
}

function calculateMomentum(data: { rate: number; date: Date }[]): number {
  // Calculate trend strength and direction
  const recentRates = data.slice(-14);
  const oldRates = data.slice(-28, -14);
  const recentAvg =
    recentRates.reduce((sum, d) => sum + d.rate, 0) / recentRates.length;
  const oldAvg = oldRates.reduce((sum, d) => sum + d.rate, 0) / oldRates.length;
  return ((recentAvg - oldAvg) / oldAvg) * 100;
}

function calculateHabitSynergy(habits: CombinedHabit[], userId?: string) {
  let complementaryCount = 0;
  let totalSynergy = 0;
  const maxPossiblePairs = (habits.length * (habits.length - 1)) / 2;

  // Compare each habit pair
  for (let i = 0; i < habits.length; i++) {
    for (let j = i + 1; j < habits.length; j++) {
      const synergy = calculatePairSynergy(habits[i], habits[j], userId);
      if (synergy > 0.7) {
        complementaryCount++;
        totalSynergy += synergy;
      }
    }
  }

  return {
    score: Math.min(
      100,
      (totalSynergy / Math.max(complementaryCount, 1)) * 100
    ),
    complementaryHabits: Math.min(complementaryCount, maxPossiblePairs),
  };
}

function calculatePairSynergy(
  habit1: CombinedHabit,
  habit2: CombinedHabit,
  userId?: string
) {
  let commonCompletions = 0;
  let totalDays = 0;

  // Get all dates from both habits
  const dates = new Set<string>();

  if (isGroupHabit(habit1)) {
    habit1.completions.forEach((c) => dates.add(c.date));
  } else {
    Object.keys(habit1.completions).forEach((date) => dates.add(date));
  }

  if (isGroupHabit(habit2)) {
    habit2.completions.forEach((c) => dates.add(c.date));
  } else {
    Object.keys(habit2.completions).forEach((date) => dates.add(date));
  }

  // Check each date for completions
  dates.forEach((date) => {
    const completion1 = getHabitCompletionForDay(habit1, date, userId);
    const completion2 = getHabitCompletionForDay(habit2, date, userId);

    if (completion1 !== undefined && completion2 !== undefined) {
      totalDays++;
      if (completion1 && completion2) {
        commonCompletions++;
      }
    }
  });

  return totalDays > 0 ? commonCompletions / totalDays : 0;
}

function calculateBurnoutRisk(data: { rate: number; date: Date }[]) {
  const recentData = data.slice(-14); // Last 2 weeks
  const stability = calculateVolatility(
    recentData.map((d) => d.rate),
    true
  );
  const trend = calculateMomentum(recentData);

  let riskLevel = "Low";
  let recommendation = "Maintain current pace";

  // Now using stability score (higher is better)
  if (stability < 70 && trend < -10) {
    riskLevel = "High";
    recommendation = "Consider reducing habit complexity temporarily";
  } else if (stability < 80 || trend < -5) {
    riskLevel = "Medium";
    recommendation = "Monitor energy levels and adjust as needed";
  }

  return {
    level: riskLevel,
    recommendation,
    // Burnout risk score is inverse of stability plus trend impact
    score: Math.min(100, Math.round(100 - stability + Math.abs(trend) / 2)),
  };
}

function analyzeStreakPatterns(dates: Date[], habit?: CombinedHabit) {
  // Sort dates chronologically
  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
  if (sortedDates.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      recoveryRate: 0,
      score: 0,
      streakQuality: "No data yet",
      recommendation: "Start your first streak!",
    };
  }

  let currentStreak = 0;
  let bestStreak = 0;
  let recoveryCount = 0;
  let breakCount = 0;

  // Helper function to check if a completion value meets the goal
  const meetsGoal = (value: HabitCompletionValue | undefined): boolean => {
    if (!habit) return Boolean(value); // For all habits view
    if (value === undefined) return false; // Handle missing dates

    if (typeof value !== "number") return Boolean(value);

    switch (habit.type) {
      case HabitType.NUMERIC:
        const numConfig = habit.config as NumericHabitConfig;
        return numConfig.higherIsBetter
          ? value >= numConfig.goal
          : value <= numConfig.goal;

      case HabitType.RATING:
        const ratingConfig = habit.config as RatingHabitConfig;
        return value >= ratingConfig.goal;

      default:
        return Boolean(value);
    }
  };

  // Get all dates between first and last completion, excluding today
  const yesterday = subDays(new Date(), 1);
  const dateRange = eachDayOfInterval({
    start: sortedDates[0],
    end: yesterday,
  });

  // Analyze each date in the range
  for (let i = 0; i < dateRange.length; i++) {
    const dateStr = format(dateRange[i], "yyyy-MM-dd");

    // Get completion value for this date (or undefined for missing dates)
    const completionValue = habit
      ? isGroupHabit(habit)
        ? habit.completions.find((c) => c.date === dateStr)?.completed
        : habit.completions[dateStr]
      : undefined;

    if (meetsGoal(completionValue)) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      if (currentStreak > 0) {
        breakCount++;
        if (i < dateRange.length - 1) {
          const nextDayStr = format(dateRange[i + 1], "yyyy-MM-dd");
          const nextDayCompletion = habit
            ? isGroupHabit(habit)
              ? habit.completions.find((c) => c.date === nextDayStr)?.completed
              : habit.completions[nextDayStr]
            : undefined;
          if (meetsGoal(nextDayCompletion)) recoveryCount++;
        }
      }
      currentStreak = 0;
    }
  }

  // Check today's completion separately to add to current streak if completed
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayCompletion = habit
    ? isGroupHabit(habit)
      ? habit.completions.find((c) => c.date === todayStr)?.completed
      : habit.completions[todayStr]
    : undefined;

  if (meetsGoal(todayCompletion)) {
    currentStreak++;
    bestStreak = Math.max(bestStreak, currentStreak);
  }

  const recoveryRate =
    breakCount > 0 ? (recoveryCount / breakCount) * 100 : 100;
  const score = Math.min(100, bestStreak * 5 + recoveryRate / 2);

  return {
    currentStreak,
    bestStreak,
    recoveryRate: Math.round(recoveryRate),
    score: Math.round(score),
    streakQuality:
      bestStreak > 30 ? "Excellent consistency" : "Building momentum",
    recommendation: getStreakRecommendation(
      currentStreak,
      bestStreak,
      recoveryRate
    ),
  };
}

function analyzeTimePatterns(dates: Date[]) {
  if (dates.length === 0)
    return {
      optimalTime: "Unknown",
      optimalDay: "Unknown",
      successRate: 0,
      daySuccessRate: 0,
    };

  const timeMap = new Map<number, number>();
  const dayMap = new Map<number, number>();

  dates.forEach((date) => {
    const hour = date.getHours();
    const day = getDay(date);
    timeMap.set(hour, (timeMap.get(hour) || 0) + 1);
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  });

  const optimalHour = Array.from(timeMap.entries()).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0];
  const optimalDay = Array.from(dayMap.entries()).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0];
  const successRate = Math.round(
    ((timeMap.get(optimalHour) || 0) / dates.length) * 100
  );
  const daySuccessRate = Math.round(
    ((dayMap.get(optimalDay) || 0) / dates.length) * 100
  );

  return {
    optimalTime: `${optimalHour}:00`,
    optimalDay: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][optimalDay],
    successRate,
    daySuccessRate,
    completionRate: Math.round((dates.length / 90) * 100),
    consistency: successRate > 80 ? "Very consistent" : "Moderately consistent",
    score: Math.round((successRate + daySuccessRate) / 2),
    recommendation: getTimeRecommendation(optimalHour, successRate),
  };
}

function getStreakRecommendation(
  current: number,
  best: number,
  recovery: number
): string {
  if (current >= best && best > 7)
    return "You're at your best! Keep the momentum going";
  if (recovery > 80) return "Great at getting back on track after breaks";
  return "Focus on small wins to build longer streaks";
}

function getTimeRecommendation(hour: number, successRate: number): string {
  if (successRate > 80) return `${hour}:00 is your power hour - stick with it!`;
  return "Consider adjusting your habit timing for better consistency";
}

function calculateHabitDiversity(habits: CombinedHabit[]) {
  const categories = new Set(habits.map((h) => h.category));
  const categoryCount = categories.size;

  const distributionScore = Math.min(100, categoryCount * 20);

  let recommendation = "";
  if (categoryCount < 3) {
    recommendation = "Consider adding habits from other life areas";
  } else if (categoryCount < 5) {
    recommendation = "Good variety, room to expand";
  } else {
    recommendation = "Excellent habit distribution";
  }

  return {
    score: distributionScore,
    categories: categoryCount,
    recommendation,
  };
}
