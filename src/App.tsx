import { Route, BrowserRouter as Router, Routes, Navigate } from 'react-router-dom';
import { HabitProvider } from './contexts/HabitContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { useUser } from './contexts/UserContext';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import Navbar from './components/Navbar';
import Landing from './components/Landing';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import { Toaster } from 'react-hot-toast';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { HabitDisplayProvider } from './contexts/HabitDisplayContext';

function AppContent() {
  const { state } = useUser();

  // Show loading state while the user context is loading
  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tl from-sky-100 via-cyan-100 to-violet-200 dark:from-sky-950 dark:via-cyan-950 dark:to-violet-950 transition-all duration-500">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-400 border-t-transparent dark:border-violet-600 dark:border-t-transparent" />
        </div>
      </div>
    )
  }

  function ProtectedRoute({ children }: { children: React.ReactNode }) {
    if (!state.isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-tl from-sky-100 via-cyan-100 to-violet-200 dark:from-sky-950 dark:via-cyan-950 dark:to-violet-950 transition-all duration-500">
      <Navbar />
      <Routes>
        <Route path="/" element={state.isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/landing" />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <>
      <Toaster />
      <ThemeProvider>
        <UserProvider>
          <AnalyticsProvider>
            <HabitDisplayProvider>
              <HabitProvider>
                <Router>
                  <AppContent />
                </Router>
              </HabitProvider>
            </HabitDisplayProvider>
          </AnalyticsProvider>
        </UserProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
