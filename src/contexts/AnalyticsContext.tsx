import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from "react";
import { API_BASE_URL, handleApiResponse } from "../api/config";
import { useUser } from "./UserContext";

export interface KeyInsight {
  title: string;
  description: string;
  explanation: string;
  score: number;
  impact_score: number;
  confidence: number;
  polarity: string;
}

export interface SuccessFailurePattern {
  title: string;
  description: string;
  time_period: string;
  confidence: number;
  success: boolean;
}

export interface ActionableRecommendation {
  title: string;
  description: string;
  expected_impact: number;
}

export interface CorrelationInsight {
  correlating_habit: string;
  insights: string[];
  recommendations: string[];
}

interface Analytics {
  publishedAt: string;
  keyInsights: {
    insights: KeyInsight[];
  };
  individualHabitKeyInsights: {
    [habitId: string]: {
      insights: KeyInsight[];
    };
  };
  successFailurePatterns: {
    [habitId: string]: {
      patterns: SuccessFailurePattern[];
    };
  };
  actionableRecommendations: {
    [habitId: string]: {
      recommendations: ActionableRecommendation[];
    };
  };
  correlationInsights: {
    [habitId: string]: {
      correlations: CorrelationInsight[];
    };
  };
}

interface UserAnalytics {
  id: string;
  userId: string;
  analytics: Analytics[];
}

interface AnalyticsState {
  analytics: UserAnalytics;
  loading: boolean;
  error: string | null;
}

type AnalyticsAction =
  | { type: "SET_ANALYTICS"; payload: UserAnalytics }
  | { type: "SET_ERROR"; payload: string }
  | { type: "RESET_DATA" };

const initialState: AnalyticsState = {
  analytics: {
    id: "",
    userId: "",
    analytics: [],
  },
  loading: true,
  error: null,
};

const AnalyticsContext = createContext<
  | {
      state: AnalyticsState;
      dispatch: React.Dispatch<AnalyticsAction>;
    }
  | undefined
>(undefined);

function analyticsReducer(
  state: AnalyticsState,
  action: AnalyticsAction
): AnalyticsState {
  switch (action.type) {
    case "SET_ANALYTICS":
      return {
        ...state,
        analytics: action.payload,
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

async function fetchAnalytics(userId: string): Promise<UserAnalytics> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/analytics`);
  return handleApiResponse(response);
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(analyticsReducer, initialState);
  const { state: userState } = useUser();

  useEffect(() => {
    // Reset analytics when user logs out
    if (!userState.isAuthenticated) {
      localStorage.removeItem("analytics");
      localStorage.removeItem("analytics_expiration");
      dispatch({ type: "RESET_DATA" });
      return;
    }

    // Load analytics when user is authenticated
    if (userState.isAuthenticated && userState.profile) {
      const loadAnalytics = async () => {
        const savedAnalytics = localStorage.getItem("analytics");
        const expiration = localStorage.getItem("analytics_expiration");
        const now = new Date().getTime();

        if (savedAnalytics && expiration && now < parseInt(expiration)) {
          dispatch({
            type: "SET_ANALYTICS",
            payload: JSON.parse(savedAnalytics),
          });
        } else {
          try {
            const analytics = await fetchAnalytics(userState.profile!.id);
            localStorage.setItem("analytics", JSON.stringify(analytics));
            localStorage.setItem(
              "analytics_expiration",
              (now + 3600000).toString()
            );
            dispatch({ type: "SET_ANALYTICS", payload: analytics });
          } catch (error: any) {
            dispatch({ type: "SET_ERROR", payload: error.message });
          }
        }
      };

      loadAnalytics();
    }
  }, [userState.isAuthenticated, userState.profile]);

  return (
    <AnalyticsContext.Provider value={{ state, dispatch }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}
