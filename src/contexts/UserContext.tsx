import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { API_BASE_URL, handleApiResponse } from '../api/config';

interface UserProfile {
  id: string;
  email: string;
  password: string;
  name: string;
  isPremium: boolean;
  createdAt: string;
  profileImage?: string;
}

interface UserState {
  isAuthenticated: boolean;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  name: string;
}

type UserAction =
  | { type: 'LOGIN_SUCCESS'; payload: UserState }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: UserState }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }

const initialState: UserState = {
  isAuthenticated: false,
  profile: null,
  loading: true,
  error: null,
  name: '',
};

const UserContext = createContext<{
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
} | undefined>(undefined);

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('user', JSON.stringify(action.payload));
      return action.payload;
    
    case 'LOGOUT':
      localStorage.removeItem('user');
      return {
        ...state,
        isAuthenticated: false,
        profile: null,
      };
    
    case 'UPDATE_PROFILE':
      const updatedProfile = action.payload;
      localStorage.setItem('user', JSON.stringify(updatedProfile));
      return updatedProfile;
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    
    default:
      return state;
  }
}

async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleApiResponse(response);
}

async function createUser(userData: Omit<UserProfile, 'id' | 'createdAt'>) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return handleApiResponse(response);
}

async function updateUser(userId: string, userData: Partial<UserProfile>) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return handleApiResponse(response);
}

export const userApi = {
  login: loginUser,
  create: createUser,
  update: updateUser,
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, initialState);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: JSON.parse(savedUser) });
    }
  }, []);

  return (
    <UserContext.Provider value={{ state, dispatch }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 