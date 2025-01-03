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
import {
  HabitType,
  NumericHabitConfig,
  RatingHabitConfig,
} from "../../types/habit";
import { Listbox } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";

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
  const [selectedHabit, setSelectedHabit] = useState<string | null>(() =>
    group.habits.length > 0 ? group.habits[0].id : null
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
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

    // Helper function to get value based on habit type
    const getDailyValue = (completion: any) => {
      if (!completion) return 0;

      switch (habit.type) {
        case HabitType.BOOLEAN:
          return completion.completed ? 100 : 0;
        case HabitType.NUMERIC:
        case HabitType.RATING:
          const value =
            typeof completion.completed === "boolean"
              ? completion.completed
                ? 100
                : 0
              : Number(completion.completed);
          return isNaN(value) ? 0 : value;
        default:
          return 0;
      }
    };

    // Calculate individual member data
    const memberData = group.memberDetails
      .filter((member) => selectedMembers.includes(member.id))
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
            value: getDailyValue(completion),
            hasData: completion !== undefined,
          };
        });

        // Calculate rolling average
        const rollingAverage = dailyValues.map((_, index, arr) => {
          const start = Math.max(0, index - 6);
          const subset = arr.slice(start, index + 1).filter((v) => v.hasData);

          if (subset.length === 0) return 0;

          const sum = subset.reduce((acc, val) => acc + val.value, 0);
          return sum / subset.length;
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

    // Only include datasets for selected members and group average if enabled
    const datasets = [
      ...(showGroupAverage
        ? [
            {
              label: "Group Average",
              data: dateRange.map((date, i) => {
                const dateStr = format(date, "yyyy-MM-dd");
                const validValues = group.memberDetails
                  .map((member) => {
                    const completion = habit.completions?.find(
                      (c) =>
                        c.userId === member.id &&
                        format(new Date(c.date), "yyyy-MM-dd") === dateStr
                    );
                    return completion ? getDailyValue(completion) : null;
                  })
                  .filter((value): value is number => value !== null); // Type guard to filter out null values

                return validValues.length > 0
                  ? validValues.reduce((a, b) => a + b, 0) / validValues.length
                  : 0;
              }),
              borderColor: "rgb(99, 102, 241)",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              tension: 0.4,
              fill: true,
              pointRadius: 6,
              pointHoverRadius: 8,
              borderWidth: 3,
              borderDash: [5, 5],
            },
          ]
        : []),
      ...memberData,
    ];

    // Calculate yAxisMax based on habit type
    const yAxisMax = (() => {
      switch (habit.type) {
        case HabitType.BOOLEAN:
          return 100;
        case HabitType.NUMERIC:
          const maxValue = Math.max(
            ...datasets.flatMap((dataset) => dataset.data),
            habit.config?.goal || 0
          );
          return Math.ceil(maxValue * 1.1); // Add 10% padding
        case HabitType.RATING:
          const config = habit.config as RatingHabitConfig;
          return config.max || 5;
        default:
          return 100;
      }
    })();

    return {
      labels: dateRange.map((date) => format(date, "MMM d")),
      datasets,
      habitType: habit.type,
      habitConfig: habit.config,
      yAxisMax,
    };
  }, [
    selectedHabit,
    group.habits,
    group.memberDetails,
    yesterday,
    isMobile,
    showGroupAverage,
    selectedMembers,
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
            const value = Math.round(context.raw * 100) / 100;
            const name = context.dataset.label;

            if (!chartData?.habitType || !chartData?.habitConfig) {
              return `${name}: ${value}%`;
            }

            const formatValue = (val: number) => {
              switch (chartData.habitType) {
                case HabitType.BOOLEAN:
                  return `${val}%`;
                case HabitType.NUMERIC:
                  const numericConfig =
                    chartData.habitConfig as NumericHabitConfig;
                  return `${val} ${numericConfig.unit || ""}`;
                case HabitType.RATING:
                  return `${val}`;
                default:
                  return `${val}%`;
              }
            };

            return `${name}: ${formatValue(value)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: chartData?.yAxisMax ?? 100,
        grid: {
          color: "rgba(107, 114, 128, 0.08)",
          drawBorder: false,
        },
        ticks: {
          callback: (value: number) => {
            if (!chartData?.habitType || !chartData?.habitConfig)
              return `${value}%`;

            switch (chartData.habitType) {
              case HabitType.BOOLEAN:
                return `${value}%`;
              case HabitType.NUMERIC:
                const numericConfig =
                  chartData.habitConfig as NumericHabitConfig;
                return `${value} ${numericConfig.unit || ""}`;
              case HabitType.RATING:
                return value;
              default:
                return value;
            }
          },
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
        <Listbox value={selectedHabit} onChange={setSelectedHabit}>
          <div className="relative w-72">
            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2 pl-3 pr-10 text-left border border-gray-200 dark:border-gray-700">
              <span className="block truncate">
                {group.habits.find((h) => h.id === selectedHabit)?.name}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg border border-gray-200 dark:border-gray-700">
              {group.habits.map((habit) => (
                <Listbox.Option
                  key={habit.id}
                  value={habit.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-3 pr-9 ${
                      active
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100"
                        : "text-gray-900 dark:text-gray-100"
                    }`
                  }
                >
                  {({ selected }) => (
                    <span
                      className={`block truncate ${
                        selected ? "font-medium" : "font-normal"
                      }`}
                    >
                      {habit.name}
                    </span>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>

        <div className="flex gap-2">
          <button
            onClick={() => setShowGroupAverage(!showGroupAverage)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
              showGroupAverage
                ? "bg-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-purple-900/20"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
            }`}
          >
            Group Average
          </button>
          {group.memberDetails.map((member) => (
            <button
              key={member.id}
              onClick={() => {
                setSelectedMembers((prev) =>
                  prev.includes(member.id)
                    ? prev.filter((id) => id !== member.id)
                    : [...prev, member.id]
                );
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                selectedMembers.includes(member.id)
                  ? "bg-purple-600 text-white shadow-md shadow-purple-200 dark:shadow-purple-900/20"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300"
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
