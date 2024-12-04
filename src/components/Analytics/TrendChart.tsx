import { useMemo } from 'react';
import { useHabits } from '../../contexts/HabitContext';
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
  const today = new Date();
  const yesterday = subDays(today, 1);

  const chartData = useMemo(() => {
    const earliestDate = habitId === 'all'
      ? Math.min(...state.habits.flatMap(h => 
          Object.keys(h.completions).map(date => new Date(date).getTime())
        ))
      : Math.min(...Object.keys(state.habits.find(h => h.id === habitId)?.completions || [])
          .map(date => new Date(date).getTime()));

    if (!isFinite(earliestDate) || 
        (yesterday.getTime() - earliestDate) / (1000 * 60 * 60 * 24) < 7) {
      return null;
    }

    const startDate = new Date(Math.max(
      earliestDate,
      subDays(yesterday, 29).getTime()
    ));

    const dateRange = eachDayOfInterval({
      start: startDate,
      end: yesterday,
    });

    if (habitId === 'all') {
      const dailyRates = dateRange.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const completedCount = state.habits.filter(h => h.completions[dateStr]).length;
        return {
          date: format(date, 'MMM d'),
          rate: (completedCount / state.habits.length) * 100,
        };
      });

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
    } else {
      const habit = state.habits.find(h => h.id === habitId);
      if (!habit) return null;

      const dailyCompletions = dateRange.map(date => ({
        date: format(date, 'MMM d'),
        completed: habit.completions[format(date, 'yyyy-MM-dd')] ? 100 : 0,
      }));

      const points = dailyCompletions.map((d, i) => ({ x: i, y: d.completed }));
      const { slope, intercept } = calculateLinearRegression(points);
      const trendLineData = points.map(p => slope * p.x + intercept);

      return {
        labels: dailyCompletions.map(d => d.date),
        datasets: [
          {
            label: habit.name,
            data: dailyCompletions.map(d => d.completed),
            borderColor: habit.color || 'rgb(99, 102, 241)',
            backgroundColor: `${habit.color || 'rgb(99, 102, 241, 0.1)'}`,
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
      };
    }
  }, [state.habits, habitId]);

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
          label: (context: any) => `${Math.round(context.raw)}% Complete`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(107, 114, 128, 0.08)',
          drawBorder: false,
        },
        ticks: {
          callback: (value: number) => `${value}%`,
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

  if (!chartData) return null;

  return (
    <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                    border border-white/20 dark:border-gray-800/30 shadow-xl w-full">
      <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                     dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text mb-6">
        Progress Trends
      </h3>
      <div className="h-[400px] w-full bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 
                      transition-all duration-200 hover:shadow-lg">
        <Line data={chartData} options={options as any} />
      </div>
    </div>
  );
}
