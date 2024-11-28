import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Habit, HabitCompletion } from '../types/habit';

interface HabitState {
  habits: Habit[];
  loading: boolean;
  error: string | null;
}

type HabitAction =
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'REMOVE_HABIT'; payload: string }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'TOGGLE_COMPLETION'; payload: HabitCompletion }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'IMPORT_HABITS'; payload: Habit[] }
  | { type: 'RESET_DATA' };

const initialState: HabitState = {
  habits: [],
  loading: false,
  error: null,
};

const HabitContext = createContext<{
  state: HabitState;
  dispatch: React.Dispatch<HabitAction>;
} | undefined>(undefined);

function habitReducer(state: HabitState, action: HabitAction): HabitState {
  let newState;
  
  switch (action.type) {
    case 'ADD_HABIT':
      newState = {
        ...state,
        habits: [...state.habits, action.payload],
      };
      localStorage.setItem('habits', JSON.stringify(newState.habits));
      return newState;
    
    case 'REMOVE_HABIT':
      newState = {
        ...state,
        habits: state.habits.filter(habit => habit.id !== action.payload),
      };
      localStorage.setItem('habits', JSON.stringify(newState.habits));
      return newState;
    
    case 'UPDATE_HABIT':
      newState = {
        ...state,
        habits: state.habits.map(habit =>
          habit.id === action.payload.id ? action.payload : habit
        ),
      };
      localStorage.setItem('habits', JSON.stringify(newState.habits));
      return newState;
    
    case 'TOGGLE_COMPLETION':
      newState = {
        ...state,
        habits: state.habits.map(habit =>
          habit.id === action.payload.habitId
            ? {
                ...habit,
                completions: {
                  ...habit.completions,
                  [action.payload.date]: action.payload.completed,
                },
              }
            : habit
        ),
      };
      localStorage.setItem('habits', JSON.stringify(newState.habits));
      return newState;
    
    case 'IMPORT_HABITS':
      return {
        ...state,
        habits: action.payload,
      };
    
    default:
      return state;
  }
}

export function HabitProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(habitReducer, initialState);

  // Load habits from localStorage on mount
  useEffect(() => {
    const savedHabits = localStorage.getItem('habits');
    if (savedHabits) {
      dispatch({ type: 'IMPORT_HABITS', payload: JSON.parse(savedHabits) });
    }
  }, []);

  return (
    <HabitContext.Provider value={{ state, dispatch }}>
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
}

// Utility functions for habit management
export function createHabit(name: string, emoji: string, color?: string): Habit {
  return {
    id: crypto.randomUUID(),
    name,
    emoji,
    color,
    createdAt: new Date().toISOString(),
    completions: {},
  };
}
