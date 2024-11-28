export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color?: string;
  createdAt: string;
  completions: HabitCompletions;
  category?: string;
}

// This represents a map of dates to completion status
export interface HabitCompletions {
  [date: string]: boolean;
}

// For database operations
export interface HabitCompletion {
  habitId: string;
  date: string;
  completed: boolean;
}

export interface HabitStats {
  totalCompletions: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
}

// Add this after the existing interfaces
export interface HabitCategory {
  id: string;
  name: string;
  color: string;
}

// Predefined categories
export const DEFAULT_CATEGORIES: HabitCategory[] = [
  { id: 'health', name: 'Health', color: '#10B981' },
  { id: 'productivity', name: 'Productivity', color: '#6366F1' },
  { id: 'learning', name: 'Learning', color: '#F59E0B' },
  { id: 'fitness', name: 'Fitness', color: '#EF4444' },
  { id: 'mindfulness', name: 'Mindfulness', color: '#8B5CF6' },
  { id: 'social', name: 'Social', color: '#EC4899' },
  { id: 'other', name: 'Other', color: '#6B7280' },
];
