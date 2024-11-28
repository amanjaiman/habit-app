import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

export default function LoginForm() {
  const navigate = useNavigate();
  const { dispatch } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, we'd validate credentials with an API
    // For now, simulate a successful login
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        isAuthenticated: true,
        loading: false,
        error: null,
        name: formData.email.split('@')[0],
        profile: {
          id: '1',
          email: formData.email,
          password: formData.password,
          name: formData.email.split('@')[0],
          isPremium: false,
          createdAt: new Date().toISOString(),
        },
      },
    });
    
    navigate('/');
  };

  return (
    <div className="h-full w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full backdrop-blur-sm bg-white/30 rounded-2xl p-8 
                    border border-white/20 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 
                       text-transparent bg-clip-text">
            Welcome Back
          </h2>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 
                       shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 
                       shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
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

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-purple-600 hover:text-purple-500">
            Sign up
          </Link>
          {' · '}
          <Link to="/" className="text-purple-600 hover:text-purple-500">
            Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
} 