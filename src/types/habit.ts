export enum HabitType {
  BOOLEAN = "boolean",
  NUMERIC = "numeric",
  RATING = "rating"
}

export interface NumericHabitConfig {
  goal: number;
  unit: string;
  higherIsBetter: boolean;
}

export interface RatingHabitConfig {
  min: number;
  max: number;
  goal: number;
}

export type HabitConfig = NumericHabitConfig | RatingHabitConfig;

// Update completion type to support numbers
export type HabitCompletionValue = boolean | number;

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color?: string;
  createdAt: string;
  completions: Record<string, HabitCompletionValue>;
  category?: string;
  type: HabitType;
  config?: HabitConfig;
}

// Update this to support numeric values
export interface HabitCompletion {
  habitId: string;
  date: string;
  completed: HabitCompletionValue;
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
  darkColor: string;
}

// Predefined categories
export const DEFAULT_CATEGORIES: HabitCategory[] = [
  { id: 'health', name: 'Health', color: '#34D399', darkColor: '#059669' },         // Light/dark green
  { id: 'productivity', name: 'Productivity', color: '#818CF8', darkColor: '#4F46E5' }, // Light/dark indigo
  { id: 'learning', name: 'Learning', color: '#FBBF24', darkColor: '#D97706' },     // Light/dark amber
  { id: 'fitness', name: 'Fitness', color: '#F87171', darkColor: '#DC2626' },       // Light/dark red
  { id: 'mindfulness', name: 'Mindfulness', color: '#A78BFA', darkColor: '#7C3AED' }, // Light/dark purple
  { id: 'social', name: 'Social', color: '#F472B6', darkColor: '#DB2777' },         // Light/dark pink
  { id: 'other', name: 'Other', color: '#9CA3AF', darkColor: '#4B5563' },          // Light/dark gray
];
