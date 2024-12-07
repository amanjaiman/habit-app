import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userApi, useUser } from '../../contexts/UserContext';

export default function LoginForm() {
  const navigate = useNavigate();
  const { dispatch } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await userApi.login(formData.email, formData.password);
      
      let subscription = null;
      try {
        subscription = await userApi.getSubscription(user.id);
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          isAuthenticated: true,
          loading: false,
          error: null,
          name: user.name,
          profile: user,
          subscription,
        },
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full backdrop-blur-sm bg-white/30 dark:bg-black/30 rounded-2xl p-8 
                    border border-white/20 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                       text-transparent bg-clip-text">
            Welcome Back
          </h2>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                       dark:bg-gray-800 dark:text-gray-100 px-3 py-2 shadow-sm 
                       focus:border-purple-500 focus:outline-none focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 
                       dark:bg-gray-800 dark:text-gray-100 px-3 py-2 shadow-sm 
                       focus:border-purple-500 focus:outline-none focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 
                     text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Sign In
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Don't have an account?{' '}
          <Link to="/signup" className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
} 