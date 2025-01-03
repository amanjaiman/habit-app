import { useMemo, useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { format, eachDayOfInterval, subDays } from "date-fns";
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
  ChartData,
} from "chart.js";
import { Group } from "../../contexts/GroupContext";
import { HabitType } from "../../types/habit";

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

export default function GroupTrendChart({ group }: GroupTrendChartProps) {
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showGroupAverage, setShowGroupAverage] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const today = new Date();
  const yesterday = subDays(today, 1);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const chartData = useMemo(() => {
    if (!selectedHabit) return null;

    const habit = group.habits.find((h) => h.id === selectedHabit);
    if (!habit) return null;

    const startDate = new Date(
      Math.max(
        Math.min(
          ...group.habits.flatMap(
            (habit) =>
              habit.completions?.map((completion) =>
                new Date(completion.date).getTime()
              ) || []
          )
        ),
        subDays(yesterday, isMobile ? 13 : 29).getTime()
      )
    );

    const dateRange = eachDayOfInterval({
      start: startDate,
      end: yesterday,
    });

    // Calculate individual member data
    const memberData = group.memberDetails
      .filter((member) => !selectedMember || member.id === selectedMember)
      .map((member) => {
        const dailyValues = dateRange.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const completion = habit.completions?.find(
            (c) =>
              c.userId === member.id &&
              format(new Date(c.date), "yyyy-MM-dd") === dateStr
          );

          return {
            date: format(date, "MMM d"),
            value: completion?.completed || 0,
            completed: completion?.completed || false,
          };
        });

        // Calculate rolling average based on habit type
        const rollingAverage = dailyValues.map((_, index, arr) => {
          const start = Math.max(0, index - 6);
          const subset = arr.slice(start, index + 1);

          if (habit.type === HabitType.BOOLEAN) {
            const completedCount = subset.filter((v) => v.completed).length;
            return (completedCount / subset.length) * 100;
          } else {
            const sum = subset.reduce((acc, val) => acc + Number(val.value), 0);
            return sum / subset.length;
          }
        });

        // Generate color and return dataset
        const hue = parseInt(member.id, 16) % 360;
        const color = `hsl(${hue}, 70%, 50%)`;

        return {
          label: member.name,
          data: rollingAverage,
          borderColor: color,
          backgroundColor: `hsla(${hue}, 70%, 50%, 0.1)`,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        };
      });

    // Calculate group average if enabled
    const datasets = showGroupAverage
      ? [
          {
            label: "Group Average",
            data: dateRange.map((date, i) => {
              const allValues = memberData.map((m) => m.data[i]);
              return allValues.reduce((a, b) => a + b, 0) / allValues.length;
            }),
            borderColor: "rgb(99, 102, 241)",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          ...memberData,
        ]
      : memberData;

    return {
      labels: dateRange.map((date) => format(date, "MMM d")),
      datasets,
      habitType: habit.type,
      habitConfig: habit.config,
    };
  }, [
    selectedHabit,
    group.habits,
    group.memberDetails,
    yesterday,
    isMobile,
    showGroupAverage,
    selectedMember,
  ]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        titleColor: "#fff",
        bodyColor: "#cbd5e1",
        padding: {
          top: 10,
          bottom: 10,
          left: 14,
          right: 14,
        },
        titleFont: {
          size: 14,
          weight: "bold",
          family: "Inter, system-ui, sans-serif",
        },
        bodyFont: {
          size: 13,
          family: "Inter, system-ui, sans-serif",
        },
        displayColors: false,
        borderWidth: 0,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const value = Math.round(context.raw);
            const isTrendLine = context.dataset.label.includes("(Trend)");
            const name = context.dataset.label.replace(" (Trend)", "");

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
          color: "rgba(107, 114, 128, 0.08)",
          drawBorder: false,
        },
        ticks: {
          callback: (value: number) => `${value}%`,
          color: "#6B7280",
          font: {
            size: 12,
            family: "Inter, system-ui, sans-serif",
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
          color: "#6B7280",
          font: {
            size: 12,
            family: "Inter, system-ui, sans-serif",
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
      mode: "index",
    },
    hover: {
      mode: "index",
      intersect: false,
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <select
          value={selectedHabit || ""}
          onChange={(e) => setSelectedHabit(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
        >
          <option value="">Select a habit</option>
          {group.habits.map((habit) => (
            <option key={habit.id} value={habit.id}>
              {habit.name}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => setShowGroupAverage(!showGroupAverage)}
            className={`px-3 py-1 rounded-full text-sm ${
              showGroupAverage
                ? "bg-purple-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Group Average
          </button>
          {group.memberDetails.map((member) => (
            <button
              key={member.id}
              onClick={() =>
                setSelectedMember(
                  selectedMember === member.id ? null : member.id
                )
              }
              className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                selectedMember === member.id
                  ? "bg-purple-600 text-white dark:bg-purple-500"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {member.name}
            </button>
          ))}
        </div>
      </div>

      {selectedHabit ? (
        <div
          className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                        border border-white/20 dark:border-gray-800/30 shadow-xl"
        >
          <div className="mb-6">
            <h3
              className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                           dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
            >
              Group Progress Trends
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Showing 7-day rolling average
            </p>
          </div>
          <div
            className="h-[400px] w-full bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 
                          transition-all duration-200 hover:shadow-lg"
          >
            {chartData && (
              <Line
                data={chartData as ChartData<"line">}
                options={options as any}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="text-center p-8 text-gray-600">
          Select a habit to view trends
        </div>
      )}
    </div>
  );
}
