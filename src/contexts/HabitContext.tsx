import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import {
  Habit,
  HabitCompletion,
  HabitCompletionValue,
  HabitConfig,
  HabitType,
} from "../types/habit";
import { API_BASE_URL, handleApiResponse } from "../api/config";
import { useUser } from "./UserContext";

interface HabitState {
  habits: Habit[];
  loading: boolean;
  error: string | null;
}

type HabitAction =
  | { type: "ADD_HABIT"; payload: Habit }
  | { type: "REMOVE_HABIT"; payload: string }
  | { type: "UPDATE_HABIT"; payload: Habit }
  | { type: "TOGGLE_COMPLETION"; payload: HabitCompletion }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "IMPORT_HABITS"; payload: Habit[] }
  | { type: "RESET_DATA" };

const initialState: HabitState = {
  habits: [],
  loading: false,
  error: null,
};

const HabitContext = createContext<
  | {
      state: HabitState;
      dispatch: React.Dispatch<HabitAction>;
    }
  | undefined
>(undefined);

// Add API functions
async function fetchHabits(userId: string): Promise<Habit[]> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/habits`);
  return handleApiResponse(response);
}

async function createHabitApi(userId: string, habit: Habit): Promise<Habit> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/habits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(habit),
  });
  return handleApiResponse(response);
}

async function updateHabitApi(userId: string, habit: Habit): Promise<Habit> {
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}/habits/${habit.id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(habit),
    }
  );
  return handleApiResponse(response);
}

async function deleteHabitApi(userId: string, habitId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}/habits/${habitId}`,
    {
      method: "DELETE",
    }
  );
  return handleApiResponse(response);
}

async function toggleHabitApi(
  userId: string,
  habitId: string,
  date: string,
  value: HabitCompletionValue
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/users/${userId}/habits/${habitId}/toggle`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, completed: value }),
    }
  );
  return handleApiResponse(response);
}

// Update the reducer to handle async operations
function habitReducer(state: HabitState, action: HabitAction): HabitState {
  switch (action.type) {
    case "ADD_HABIT":
      return {
        ...state,
        habits: [...state.habits, action.payload],
      };

    case "REMOVE_HABIT":
      return {
        ...state,
        habits: state.habits.filter((habit) => habit.id !== action.payload),
      };

    case "UPDATE_HABIT":
      return {
        ...state,
        habits: state.habits.map((habit) =>
          habit.id === action.payload.id ? action.payload : habit
        ),
      };

    case "TOGGLE_COMPLETION":
      return {
        ...state,
        habits: state.habits.map((habit) =>
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

    case "IMPORT_HABITS":
      return {
        ...state,
        habits: action.payload,
        loading: false,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case "RESET_DATA":
      return initialState;

    default:
      return state;
  }
}

export function HabitProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(habitReducer, initialState);
  const { state: userState } = useUser();

  // Load habits from API when user is authenticated
  useEffect(() => {
    if (userState.isAuthenticated && userState.profile) {
      const loadHabits = async () => {
        try {
          const habits = await fetchHabits(userState.profile!.id);
          dispatch({ type: "IMPORT_HABITS", payload: habits });
        } catch (error: any) {
          dispatch({ type: "SET_ERROR", payload: error.message });
        }
      };
      loadHabits();
    }
  }, [userState.isAuthenticated, userState.profile]);

  return (
    <HabitContext.Provider value={{ state, dispatch }}>
      {children}
    </HabitContext.Provider>
  );
}

// Export API functions
export const habitApi = {
  fetch: fetchHabits,
  create: createHabitApi,
  update: updateHabitApi,
  delete: deleteHabitApi,
  toggle: toggleHabitApi,
};

// Update utility function to use API
export async function createHabit(
  userId: string,
  name: string,
  emoji: string,
  type: HabitType = HabitType.BOOLEAN,
  config?: HabitConfig,
  color?: string,
  category?: string
): Promise<Habit> {
  const habit: Habit = {
    id: crypto.randomUUID(),
    name,
    emoji,
    type,
    config,
    color,
    createdAt: new Date().toISOString(),
    completions: {},
    category,
  };

  return await createHabitApi(userId, habit);
}

export function useHabits() {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error("useHabits must be used within a HabitProvider");
  }
  return context;
}
