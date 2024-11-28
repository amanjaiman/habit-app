import { useMemo } from 'react';
import { useHabits } from '../../contexts/HabitContext';

export default function HabitCategoriesAnalysis() {
  const { state } = useHabits();

  const categoryData = useMemo(() => {
    const categories = state.habits.reduce((acc, habit) => {
      const category = habit.category || 'Uncategorized';
      if (!acc[category]) acc[category] = { total: 0, completed: 0 };
      const completionCount = Object.values(habit.completions).filter(Boolean).length;
      acc[category].total += Object.keys(habit.completions).length;
      acc[category].completed += completionCount;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    return Object.entries(categories).map(([category, data]) => ({
      category,
      completionRate: (data.completed / data.total) * 100,
    }));
  }, [state.habits]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
        Habit Categories Analysis
      </h3>
      <ul>
        {categoryData.map((category, index) => (
          <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
            {category.category}: {category.completionRate.toFixed(1)}%
          </li>
        ))}
      </ul>
    </div>
  );
} 