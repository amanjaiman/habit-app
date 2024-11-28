import { useState } from 'react';
import { useHabits } from '../../contexts/HabitContext';

interface CustomMetricsProps {
  habitId: string;
}

export default function CustomMetrics({ habitId }: CustomMetricsProps) {
  const { state } = useHabits();
  const [customMetric, setCustomMetric] = useState<string>('');
  const habit = state.habits.find(h => h.id === habitId);

  if (!habit) return null;

  const handleMetricChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomMetric(e.target.value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
        Custom Metrics
      </h3>
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Define Metric:
        </label>
        <input
          type="text"
          value={customMetric}
          onChange={handleMetricChange}
          className="rounded-md border-gray-300 dark:border-gray-600"
        />
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Custom Metric: {customMetric}
        </p>
      </div>
    </div>
  );
} 