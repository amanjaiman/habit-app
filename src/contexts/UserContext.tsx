import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

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