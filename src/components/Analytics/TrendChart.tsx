import { useMemo, useState, useEffect } from 'react';
import { useHabits } from '../../contexts/HabitContext';
import { useGroups, GroupHabitCompletion } from '../../contexts/GroupContext';
import { format, eachDayOfInterval, subDays } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { HabitType, NumericHabitConfig, RatingHabitConfig, Habit, HabitCompletionValue } from '../../types/habit';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendChartProps {
  habitId: string;
}

function calculateLinearRegression(points: { x: number, y: number }[]): { slope: number, intercept: number } {
  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  points.forEach(point => {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

export default function TrendChart({ habitId }: TrendChartProps) {
  const { state } = useHabits();
  const { state: groupState } = useGroups();
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const endDate = today;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const chartData = useMemo(() => {
    const personalHabit = state.habits.find(h => h.id === habitId);
    const groupHabit = groupState.groups
      .flatMap(group => group.habits)
      .find(h => h.id === habitId);
    
    const habit = personalHabit || groupHabit;

    if (habitId === 'all') {
      const earliestDate = Math.min(...state.habits.flatMap(h => 
        Object.keys(h.completions).map(date => new Date(date).getTime())
      ));

      if (earliestDate === null || !isFinite(earliestDate)) {
        return null;
      }

      const startDate = new Date(Math.max(
        earliestDate,
        subDays(endDate, isMobile ? 13 : 29).getTime()
      ));

      const dateRange = eachDayOfInterval({
        start: startDate,
        end: endDate,
      });

      const dailyRates = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const completedCount = state.habits.filter(h => h.completions[dateStr]).length;
        return {
          date: format(date, 'MMM dd'),
          rate: (completedCount / state.habits.length) * 100,
          hasData: completedCount > 0
        };
      }).filter(d => d.hasData);

      const points = dailyRates.map((d, i) => ({ x: i, y: d.rate }));
      const { slope, intercept } = calculateLinearRegression(points);
      const trendLineData = points.map(p => slope * p.x + intercept);

      return {
        labels: dailyRates.map(d => d.date),
        datasets: [
          {
            label: 'Completion Rate',
            data: dailyRates.map(d => d.rate),
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            tension: 0.3,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 8,
            borderWidth: 3,
          },
          {
            label: 'Trend',
            data: trendLineData,
            borderColor: 'rgba(99, 102, 241, 0.5)',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0,
          }
        ],
      };
    } else if (habit) {
      const getCompletionValue = (dateStr: string) => {
        if (!habit) return undefined;
        
        if ('completions' in habit && 
            !Array.isArray(habit.completions) && 
            typeof habit.completions === 'object') {
          return (habit.completions as Record<string, HabitCompletionValue>)[dateStr];
        } 
        
        if ('completions' in habit && 
            Array.isArray(habit.completions)) {
          const completion = (habit.completions as GroupHabitCompletion[]).find(c => {
            const completionDate = new Date(c.date);
            return format(completionDate, 'yyyy-MM-dd') === dateStr;
          });
          return completion?.completed;
        }
        
        return undefined;
      };

      const getDailyValue = (dateStr: string) => {
        const completion = getCompletionValue(dateStr);
        if (completion === undefined) return 0;

        if (!habit) return 0;

        switch (habit.type) {
          case HabitType.BOOLEAN:
            return completion === true ? 100 : 0;
          case HabitType.NUMERIC:
          case HabitType.RATING:
            if (Array.isArray(habit.completions)) {
              const value = typeof completion === 'boolean' 
                ? (completion ? 100 : 0)
                : Number(completion);
              return isNaN(value) ? 0 : value;
            } else {
              const value = typeof completion === 'string' 
                ? parseFloat(completion) 
                : Number(completion);
              return isNaN(value) ? 0 : value;
            }
          default:
            return 0;
        }
      };

      const earliestDate = Math.min(
        ...Object.entries(habit.completions)
          .filter(([_, value]) => value)
          .map(([date]) => new Date(date).getTime())
      );

      if (!isFinite(earliestDate)) {
        return null;
      }

      const startDate = new Date(Math.max(
        earliestDate,
        subDays(endDate, isMobile ? 13 : 29).getTime()
      ));

      const dateRange = eachDayOfInterval({
        start: startDate,
        end: endDate,
      });

      const dailyCompletions = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const value = getDailyValue(dateStr);
        
        return {
          date: format(date, 'MMM dd'),
          value,
          rawValue: value,
          hasData: habit.type === HabitType.BOOLEAN 
            ? getCompletionValue(dateStr) !== undefined
            : (value > 0 || getCompletionValue(dateStr) !== undefined)
        };
      }).filter(d => d.hasData);

      const rollingAverage = dailyCompletions.map((_, index, arr) => {
        const start = Math.max(0, index - 6);
        const subset = arr.slice(start, index + 1);
        const sum = subset.reduce((acc, val) => acc + val.value, 0);
        return sum / subset.length;
      });

      const points = dailyCompletions.map((d, i) => ({ x: i, y: d.value }));
      const { slope, intercept } = calculateLinearRegression(points);
      const trendLineData = points.map(p => slope * p.x + intercept);

      const yAxisMax = (() => {
        switch (habit.type) {
          case HabitType.BOOLEAN:
            return 100;
          case HabitType.NUMERIC:
            const numericConfig = habit.config as NumericHabitConfig;
            const maxValue = Math.max(
              ...dailyCompletions.map(d => d.rawValue as number),
              numericConfig.goal
            );
            return Math.ceil(maxValue * 1.1); // Add 10% padding
          case HabitType.RATING:
            const ratingConfig = habit.config as RatingHabitConfig;
            return ratingConfig.max;
          default:
            return 100;
        }
      })();

      return {
        labels: dailyCompletions.map(d => d.date),
        datasets: [
          {
            label: habit.name,
            data: habit.type === HabitType.BOOLEAN 
              ? rollingAverage 
              : dailyCompletions.map(d => d.value),
            borderColor: habit.color || 'rgb(99, 102, 241)',
            backgroundColor: habit.color ? `${habit.color}1A` : 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Trend',
            data: trendLineData,
            borderColor: habit.color ? `${habit.color}80` : 'rgba(99, 102, 241, 0.5)',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0,
          }
        ],
        habitType: habit.type,
        habitConfig: habit.config,
        yAxisMax,
      };
    }

    return null;
  }, [state.habits, groupState.groups, habitId, isMobile]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        padding: {
          top: 10,
          bottom: 10,
          left: 14,
          right: 14
        },
        titleFont: {
          size: 14,
          weight: 'bold',
          family: 'Inter, system-ui, sans-serif',
        },
        bodyFont: {
          size: 13,
          family: 'Inter, system-ui, sans-serif',
        },
        displayColors: false,
        borderWidth: 0,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const value = Math.round(context.raw * 100) / 100;
            const isTrendLine = context.dataset.label === 'Trend';
            
            if (habitId === 'all') {
              return isTrendLine 
                ? `Trend: ${value}%`
                : `Completion Rate: ${value}%`;
            } else {
              const personalHabit = state.habits.find(h => h.id === habitId);
              const groupHabit = groupState.groups
                .flatMap(group => group.habits)
                .find(h => h.id === habitId);
              
              const habit = personalHabit || groupHabit;
              if (!habit) return '';

              const formatValue = (val: number) => {
                switch (habit.type) {
                  case HabitType.BOOLEAN:
                    return `${val}%`;
                  case HabitType.NUMERIC:
                    const numericConfig = habit.config as NumericHabitConfig;
                    return `${val} ${numericConfig.unit}`;
                  case HabitType.RATING:
                    return `${val}`;
                  default:
                    return `${val}%`;
                }
              };

              return isTrendLine
                ? `Trend: ${formatValue(value)}`
                : habit.type === HabitType.BOOLEAN
                  ? `7-day Average: ${formatValue(value)}`
                  : `Value: ${formatValue(value)}`;
            }
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: chartData?.yAxisMax ?? 100,
        grid: {
          color: 'rgba(107, 114, 128, 0.08)',
          drawBorder: false,
        },
        ticks: {
          callback: (value: number) => {
            if (habitId === 'all') return `${value}%`;
            
            const habit = state.habits.find(h => h.id === habitId);
            if (!habit) return value;

            switch (habit.type) {
              case HabitType.BOOLEAN:
                return `${value}%`;
              case HabitType.NUMERIC:
                const numericConfig = habit.config as NumericHabitConfig;
                return `${value}${numericConfig.unit}`;
              case HabitType.RATING:
                return value;
              default:
                return value;
            }
          },
          color: '#6B7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
          },
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif',
          },
          maxRotation: 0,
          padding: 8,
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    hover: {
      mode: 'index',
      intersect: false,
    },
  };

  if (!chartData) {
    return (
      <div className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                    border border-white/20 dark:border-gray-800/30 shadow-xl text-center text-gray-600 
                    dark:text-gray-300 text-lg">
        {habitId === 'all' 
          ? "Start tracking your habits to see your trends!"
          : "No completion data found for this habit yet."}
      </div>
    );
  }

  return (
    <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                    border border-white/20 dark:border-gray-800/30 shadow-xl w-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                       dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
          Progress Trends
        </h3>
        {habitId !== 'all' && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Showing 7-day rolling average
          </p>
        )}
      </div>
      <div className="h-[400px] w-full bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 
                      transition-all duration-200 hover:shadow-lg">
        <Line data={chartData} options={options as any} />
      </div>
    </div>
  );
}
