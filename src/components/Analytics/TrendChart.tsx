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

export default function TrendChart({ habitId }: TrendChartProps) {
  const { state } = useHabits();
  const today = new Date();

  const chartData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(today, 30),
      end: today,
    });

    if (habitId === 'all') {
      const dailyRates = last30Days.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const completedCount = state.habits.filter(h => h.completions[dateStr]).length;
        return {
          date: format(date, 'MMM d'),
          rate: (completedCount / state.habits.length) * 100,
        };
      });

      return {
        labels: dailyRates.map(d => d.date),
        datasets: [
          {
            label: 'Completion Rate',
            data: dailyRates.map(d => d.rate),
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      };
    } else {
      const habit = state.habits.find(h => h.id === habitId);
      if (!habit) return null;

      const dailyCompletions = last30Days.map(date => ({
        date: format(date, 'MMM d'),
        completed: habit.completions[format(date, 'yyyy-MM-dd')] ? 100 : 0,
      }));

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
        ],
      };
    }
  }, [state.habits, habitId]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        displayColors: false,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
        },
        ticks: {
          callback: (value: number) => `${value}%`,
          color: '#6B7280',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
  };

  if (!chartData) return null;

  return (
    <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                    border border-white/20 dark:border-gray-800/30 shadow-xl">
      <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                     dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text mb-6">
        Progress Trends
      </h3>
      <div className="h-[400px] bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 
                      transition-all duration-200 hover:shadow-lg">
        <Line data={chartData} options={options as any} />
      </div>
    </div>
  );
}
