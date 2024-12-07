import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { API_BASE_URL, handleApiResponse } from '../api/config';

interface UserProfile {
  id: string;
  email: string;
  password: string;
  name: string;
  isPremium: boolean; // deprecated TODO: remove
  createdAt: string;
  profileImage?: string;
}

interface Subscription {
  userId: string;
  stripeId?: string;
  stripeSubscriptionId?: string;
  customerEmail?: string;
  customerName?: string;
  invoiceUrl?: string;
  status: string;
  created?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  nextBillingDate?: string;
  priceId?: string;
  cancelAtPeriodEnd?: boolean;
}

interface UserState {
  isAuthenticated: boolean;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  name: string;
  subscription: Subscription | null;
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
  subscription: null,
};

const UserContext = createContext<{
  state: UserState;
  dispatch: React.Dispatch<UserAction>;
} | undefined>(undefined);

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return action.payload;
    
    case 'LOGOUT':
      localStorage.removeItem('userId');
      return {
        ...initialState,
        loading: false,
      };
    
    case 'UPDATE_PROFILE':
      return action.payload;
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
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
  const data = await handleApiResponse(response);
  localStorage.setItem('userId', data.id);
  return data;
}

async function createUser(userData: Omit<UserProfile, 'id' | 'createdAt'>) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return handleApiResponse(response);
}

async function updateUser(userId: string, updatedFields: Partial<UserProfile>) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedFields),
  });
  return handleApiResponse(response);
}

async function getSubscription(userId: string) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/subscription`);
  return handleApiResponse(response);
}

async function getCurrentUser(userId: string) {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`);
  return handleApiResponse(response);
}

export const userApi = {
  login: loginUser,
  create: createUser,
  update: updateUser,
  getSubscription: getSubscription,
  getCurrent: getCurrentUser,
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, initialState);

  useEffect(() => {
    const loadUserData = async () => {
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        dispatch({ type: 'LOGOUT' });
        return;
      }

      try {
        const user = await getCurrentUser(userId);
        if (user) {
          const subscription = await getSubscription(user.id);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              isAuthenticated: true,
              loading: false,
              error: null,
              name: user.name,
              profile: user,
              subscription,
            }
          });
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        dispatch({ type: 'LOGOUT' });
      }
    };

    loadUserData();
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