import { useMemo, useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { format, eachDayOfInterval, subDays } from 'date-fns';
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
import { Group } from '../../contexts/GroupContext';

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

interface GroupTrendChartProps {
  group: Group;
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

export default function GroupTrendChart({ group }: GroupTrendChartProps) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const today = new Date();
  const yesterday = subDays(today, 1);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const chartData = useMemo(() => {
    // Get the earliest completion date
    const earliestDate = Math.min(...group.habits.flatMap(habit =>
      habit.completions?.map(completion => new Date(completion.date).getTime()) || []
    ));

    if (!isFinite(earliestDate) || 
        (yesterday.getTime() - earliestDate) / (1000 * 60 * 60 * 24) < 7) {
      return null;
    }

    const startDate = new Date(Math.max(
      earliestDate,
      subDays(yesterday, isMobile ? 13 : 29).getTime()
    ));

    const dateRange = eachDayOfInterval({
      start: startDate,
      end: yesterday,
    });

    const memberData = group.memberDetails
      .filter(member => !selectedMember || member.id === selectedMember)
      .map(member => {
        const dailyRates = dateRange.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const completedCount = group.habits.filter(habit =>
            habit.completions?.some(completion =>
              completion.userId === member.id &&
              format(new Date(completion.date), 'yyyy-MM-dd') === dateStr
            )
          ).length;
          return {
            date: format(date, 'MMM d'),
            rate: (completedCount / group.habits.length) * 100,
          };
        });

        // Calculate 7-day rolling average
        const rollingAverage = dailyRates.map((_, index, arr) => {
          const start = Math.max(0, index - 6);
          const subset = arr.slice(start, index + 1);
          const sum = subset.reduce((acc, val) => acc + val.rate, 0);
          return sum / subset.length;
        });

        // Calculate trend line
        const points = rollingAverage.map((avg, i) => ({ x: i, y: avg }));
        const { slope, intercept } = calculateLinearRegression(points);
        const trendLineData = points.map(p => slope * p.x + intercept);

        // Generate a consistent color based on member ID
        const hue = parseInt(member.id, 16) % 360;
        const color = `hsl(${hue}, 70%, 50%)`;

        return [
          {
            label: member.name,
            data: rollingAverage,
            borderColor: color,
            backgroundColor: `${color}1A`,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: `${member.name} (Trend)`,
            data: trendLineData,
            borderColor: `${color}80`,
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0,
          }
        ];
      }).flat();

    return {
      labels: dateRange.map(date => format(date, 'MMM d')),
      datasets: memberData,
    };
  }, [group, selectedMember, isMobile]);

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
            const value = Math.round(context.raw);
            const isTrendLine = context.dataset.label.includes('(Trend)');
            const name = context.dataset.label.replace(' (Trend)', '');
            
            return isTrendLine
              ? `${name} Trend: ${value}%`
              : `${name}: ${value}%`;
          },
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

  if (!chartData) return (
    <div className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                    border border-white/20 dark:border-gray-800/30 shadow-xl text-center text-gray-600 
                    dark:text-gray-300 text-lg">
      Track habits for at least 7 days to see your group trends!
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {group.memberDetails.map(member => (
          <button
            key={member.id}
            onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
            className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
              selectedMember === member.id
                ? 'bg-purple-600 text-white dark:bg-purple-500'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {member.name}
          </button>
        ))}
      </div>
      <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                      border border-white/20 dark:border-gray-800/30 shadow-xl">
        <div className="mb-6">
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                         dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
            Group Progress Trends
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Showing 7-day rolling average
          </p>
        </div>
        <div className="h-[400px] w-full bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 
                        transition-all duration-200 hover:shadow-lg">
          <Line data={chartData} options={options as any} />
        </div>
      </div>
    </div>
  );
} 