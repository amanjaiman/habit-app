import { useState } from 'react';
import { useHabits } from '../../contexts/HabitContext';

interface GoalProgressTrackingProps {
  habitId: string;
}

export default function GoalProgressTracking({ habitId }: GoalProgressTrackingProps) {
  const { state } = useHabits();
  const [goal, setGoal] = useState<number>(80); // Default goal is 80%
  const habit = state.habits.find(h => h.id === habitId);

  if (!habit) return null;

  const completionCount = Object.values(habit.completions).filter(Boolean).length;
  const totalDays = Object.keys(habit.completions).length;
  const completionRate = (completionCount / totalDays) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
        Goal Progress Tracking
      </h3>
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Set Goal (%):
        </label>
        <input
          type="number"
          value={goal}
          onChange={(e) => setGoal(Number(e.target.value))}
          className="rounded-md border-gray-300 dark:border-gray-600"
        />
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Current Completion Rate: {completionRate.toFixed(1)}%
        </p>
        <p className={`text-sm font-medium ${completionRate >= goal ? 'text-green-500' : 'text-red-500'}`}>
          {completionRate >= goal ? 'Goal Achieved!' : 'Goal Not Achieved'}
        </p>
      </div>
    </div>
  );
} 