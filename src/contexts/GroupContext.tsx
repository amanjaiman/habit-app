import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { API_BASE_URL, handleApiResponse } from '../api/config';
import { useUser } from './UserContext';
import { Habit } from '../types/habit';
import { HabitType, HabitConfig, HabitCompletionValue } from '../types/habit';

// Types
export interface GroupHabitCompletion {
  userId: string;
  date: string;
  completed: boolean | number;
}

export interface GroupHabit extends Omit<Habit, 'completions'> {
  completions: GroupHabitCompletion[];
  type: HabitType;
  config?: HabitConfig;
}

interface GroupMember {
  id: string;
  name: string;
  profileImage?: string;
  isAdmin: boolean;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  emoji: string;
  adminId: string;
  joinCode: string;
  habits: GroupHabit[];
  members: string[];
  memberDetails: GroupMember[];
  createdAt: string;
}

interface GroupState {
  groups: Group[];
  loading: boolean;
  error: string | null;
}

type GroupAction =
  | { type: 'SET_GROUPS'; payload: Group[] }
  | { type: 'ADD_GROUP'; payload: Group }
  | { type: 'UPDATE_GROUP'; payload: Group }
  | { type: 'DELETE_GROUP'; payload: string }
  | { type: 'ADD_GROUP_HABIT'; payload: { groupId: string; habit: GroupHabit } }
  | { type: 'UPDATE_GROUP_HABIT'; payload: { groupId: string; habit: GroupHabit } }
  | { type: 'REMOVE_GROUP_HABIT'; payload: { groupId: string; habitId: string } }
  | { type: 'TOGGLE_HABIT_COMPLETION'; payload: { groupId: string; habitId: string; completion: GroupHabitCompletion } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET_DATA' };

// API functions
async function fetchUserGroups(userId: string): Promise<Group[]> {
  const response = await fetch(`${API_BASE_URL}/groups/user/${userId}`);
  return handleApiResponse(response);
}

async function fetchGroup(groupId: string, userId: string): Promise<Group> {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}?user_id=${userId}`);
  return handleApiResponse(response);
}

async function createGroup(name: string, description: string | undefined, emoji: string, userId: string): Promise<Group> {
  const response = await fetch(`${API_BASE_URL}/groups?user_id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, emoji }),
  });
  return handleApiResponse(response);
}

async function updateGroup(groupId: string, updates: Partial<Group>, userId: string): Promise<Group> {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}?user_id=${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return handleApiResponse(response);
}

async function deleteGroup(groupId: string, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}?user_id=${userId}`, {
    method: 'DELETE',
  });
  return handleApiResponse(response);
}

async function joinGroup(joinCode: string, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/groups/join?user_id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ joinCode }),
  });
  return handleApiResponse(response);
}

async function createGroupHabit(
  groupId: string,
  userId: string,
  name: string,
  emoji: string,
  type: HabitType = HabitType.BOOLEAN,
  config?: HabitConfig,
  color?: string,
  category?: string,
): Promise<GroupHabit> {
  const habit: Omit<GroupHabit, 'completions'> = {
    id: crypto.randomUUID(),
    name,
    emoji,
    type,
    config,
    color,
    createdAt: new Date().toISOString(),
    category,
  };

  const response = await fetch(`${API_BASE_URL}/groups/${groupId}/habits?user_id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(habit),
  });
  return handleApiResponse(response);
}

async function toggleGroupHabitCompletion(
  groupId: string,
  habitId: string,
  date: string,
  value: boolean | number,
  userId: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/groups/${groupId}/habits/${habitId}/toggle?user_id=${userId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        date, 
        completed: value,
      }),
    }
  );
  return handleApiResponse(response);
}

async function updateGroupHabit(
  groupId: string, 
  habit: GroupHabit, 
  userId: string
): Promise<GroupHabit> {
  // Create a new object with only the fields expected by HabitBase
  const habitData = {
    id: habit.id,
    name: habit.name,
    emoji: habit.emoji,
    color: habit.color,
    type: habit.type,
    config: habit.config,
    category: habit.category,
    createdAt: habit.createdAt
  };
  
  const response = await fetch(
    `${API_BASE_URL}/groups/${groupId}/habits/${habitData.id}?user_id=${userId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habitData),
    }
  );
  return handleApiResponse(response);
}

async function deleteGroupHabit(groupId: string, habitId: string, userId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/groups/${groupId}/habits/${habitId}?user_id=${userId}`,
    {
      method: 'DELETE',
    }
  );
  return handleApiResponse(response);
}

// Context setup
const GroupContext = createContext<{
  state: GroupState;
  dispatch: React.Dispatch<GroupAction>;
} | undefined>(undefined);

const initialState: GroupState = {
  groups: [],
  loading: true,
  error: null,
};

function groupReducer(state: GroupState, action: GroupAction): GroupState {
  switch (action.type) {
    case 'SET_GROUPS':
      return {
        ...state,
        groups: action.payload,
        loading: false,
      };
    
    case 'ADD_GROUP':
      return {
        ...state,
        groups: [...state.groups, action.payload],
      };
    
    case 'UPDATE_GROUP':
      return {
        ...state,
        groups: state.groups.map(group =>
          group.id === action.payload.id ? action.payload : group
        ),
      };
    
    case 'DELETE_GROUP':
      return {
        ...state,
        groups: state.groups.filter(group => group.id !== action.payload),
      };
    
    case 'ADD_GROUP_HABIT':
      return {
        ...state,
        groups: state.groups.map(group =>
          group.id === action.payload.groupId
            ? { ...group, habits: [...group.habits, action.payload.habit] }
            : group
        ),
      };
    
    case 'UPDATE_GROUP_HABIT':
      return {
        ...state,
        groups: state.groups.map(group =>
          group.id === action.payload.groupId
            ? {
                ...group,
                habits: group.habits.map(habit =>
                  habit.id === action.payload.habit.id
                    ? action.payload.habit
                    : habit
                )
              }
            : group
        )
      };
    
    case 'REMOVE_GROUP_HABIT':
      return {
        ...state,
        groups: state.groups.map(group =>
          group.id === action.payload.groupId
            ? {
                ...group,
                habits: group.habits.filter(habit => habit.id !== action.payload.habitId)
              }
            : group
        )
      };
    
    case 'TOGGLE_HABIT_COMPLETION':
      return {
        ...state,
        groups: state.groups.map(group =>
          group.id === action.payload.groupId
            ? {
                ...group,
                habits: group.habits.map(habit =>
                  habit.id === action.payload.habitId
                    ? {
                        ...habit,
                        completions: [
                          ...habit.completions.filter(
                            c => c.userId !== action.payload.completion.userId || c.date !== action.payload.completion.date
                          ),
                          ...(action.payload.completion.completed ? [action.payload.completion] : []),
                        ],
                      }
                    : habit
                ),
              }
            : group
        ),
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    
    case 'RESET_DATA':
      return initialState;
    
    default:
      return state;
  }
}

// Provider component
export function GroupProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(groupReducer, initialState);
  const { state: userState } = useUser();

  useEffect(() => {
    if (!userState.isAuthenticated) {
      dispatch({ type: 'RESET_DATA' });
      return;
    }

    if (userState.isAuthenticated && userState.profile) {
      const loadGroups = async () => {
        try {
          const groups = await fetchUserGroups(userState.profile!.id);
          dispatch({ type: 'SET_GROUPS', payload: groups });
        } catch (error: any) {
          dispatch({ type: 'SET_ERROR', payload: error.message });
        }
      };
      loadGroups();
    }
  }, [userState.isAuthenticated, userState.profile]);

  return (
    <GroupContext.Provider value={{ state, dispatch }}>
      {children}
    </GroupContext.Provider>
  );
}

// Export API functions
export const groupApi = {
  fetch: fetchUserGroups,
  fetchGroup: fetchGroup,
  create: createGroup,
  update: updateGroup,
  delete: deleteGroup,
  join: joinGroup,
  createHabit: createGroupHabit,
  toggleHabit: toggleGroupHabitCompletion,
  updateHabit: updateGroupHabit,
  deleteHabit: deleteGroupHabit,
};

// Hook
export function useGroups() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroups must be used within a GroupProvider');
  }
  return context;
}