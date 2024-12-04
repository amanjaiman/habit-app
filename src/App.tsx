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
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

function AppContent() {
  const { state } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for authentication state to be loaded
    const checkAuth = async () => {
      // Add a small delay to ensure localStorage is checked
      await new Promise(resolve => setTimeout(resolve, 10));
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  // Show loading state or nothing while checking auth
  if (isLoading) {
    return null; // Or return a loading spinner
  }

  function ProtectedRoute({ children }: { children: React.ReactNode }) {
    if (!state.isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-tl from-sky-100 via-cyan-100 to-violet-200 dark:from-sky-950 dark:via-cyan-950 dark:to-violet-950 transition-all duration-500">
      {state.isAuthenticated && <Navbar />}
      <main className="max-w-7xl mx-auto py-8 px-6 sm:px-8 lg:px-12">
        <Routes>
          <Route path="/" element={
            state.isAuthenticated ? (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            ) : (
              <Landing />
            )
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
      </main>
    </div>
  );
}

function App() {
  return (
    <>
      <Toaster />
      <ThemeProvider>
        <UserProvider>
          <HabitProvider>
            <Router>
              <AppContent />
            </Router>
          </HabitProvider>
        </UserProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
