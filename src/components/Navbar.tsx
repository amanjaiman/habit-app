import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
  HomeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useUser } from '../contexts/UserContext';
import { useState, useRef, useEffect } from 'react';
import { useUserPremium } from '../hooks/useUserPremium';

export default function Navbar() {
  const { dispatch } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { premium } = useUserPremium();
  const location = useLocation();
  const { state: userState } = useUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = userState.isAuthenticated ? [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
    { name: 'Logout', href: '', icon: ArrowRightOnRectangleIcon, onClick: () => dispatch({ type: 'LOGOUT' }) },
  ] : [];

  const isActive = (path: string) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const profileDropdownItems = [
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
    { name: 'Logout', href: '#', icon: ArrowRightOnRectangleIcon, onClick: () => dispatch({ type: 'LOGOUT' }) },
  ];

  return (
    <nav className="z-10 relative backdrop-blur-md bg-white/30 dark:bg-gray-900/30 border-b border-white/20 dark:border-gray-800/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
                🎯 HabitsAI
              </span>
            </Link>

            <div className="hidden sm:flex sm:gap-4">
              {navigation.filter(item => !['Settings', 'Logout'].includes(item.name)).map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-full transition-all duration-200
                    ${
                      isActive(item.href)
                        ? 'bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-800/30'
                    }`}
                  onClick={item.onClick}
                >
                  <item.icon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-700 
                       dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-indigo-500"
            >
              {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
            </button>

            {userState.isAuthenticated ? (
              <div className="hidden sm:flex relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`${premium ? 'bg-gradient-to-r from-purple-600 to-pink-600 rounded-full' : ''} flex items-center space-x-2 p-1 rounded-full hover:bg-white/30 dark:hover:bg-gray-800/30`}
                >
                  {userState.profile?.profileImage ? (
                    <div className={`${premium ? 'bg-gradient-to-r from-purple-600 to-pink-600 rounded-full' : ''}`}>
                    <img
                      src={userState.profile.profileImage}
                      alt={userState.name || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-medium">
                      {userState.name ? userState.name[0].toUpperCase() : '?'}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userState.name || 'User'}
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-10 right-0 mt-1 w-56 rounded-xl shadow-lg py-2 
                                  backdrop-blur-md bg-white/80 dark:bg-gray-800/80 
                                  ring-1 ring-black/5 dark:ring-white/5 
                                  border border-gray-100 dark:border-gray-700">
                    {profileDropdownItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={(e) => {
                          if (item.onClick) {
                            e.preventDefault();
                            item.onClick();
                          }
                          setIsDropdownOpen(false);
                        }}
                        className={`flex items-center px-4 py-2.5 text-sm font-medium
                          transition-colors duration-200 
                          ${item.name === 'Logout' 
                            ? 'text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/20' 
                            : 'text-gray-700 dark:text-gray-200 hover:bg-purple-50/50 dark:hover:bg-purple-900/20'
                          }
                          ${item.name === 'Settings' ? 'mb-1' : ''}
                          group relative`}
                      >
                        <item.icon 
                          className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110
                            ${item.name === 'Logout' 
                              ? 'text-red-500 dark:text-red-400' 
                              : 'text-purple-500 dark:text-purple-400'
                            }`}
                        />
                        {item.name}
                        {item.name === 'Settings' && (
                          <div className="h-px absolute bottom-0 left-4 right-4 
                                        bg-gray-200 dark:bg-gray-700" />
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
            
            {/* Mobile menu button - only show if authenticated */}
            {userState.isAuthenticated && (
              <div className="flex items-center sm:hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`${premium ? 'text-purple-500 dark:text-purple-400' : 'text-gray-300'} inline-flex items-center justify-center p-2 rounded-md 
                          hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 
                          focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500`}
                  aria-controls="mobile-menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  <span className="sr-only">Open main menu</span>
                  {/* Icon for menu button */}
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu - only render if authenticated */}
      {userState.isAuthenticated && isMobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            {[
              ...navigation.filter(item => !['Settings', 'Logout'].includes(item.name)),
              ...profileDropdownItems
            ].map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={(e) => {
                  setIsMobileMenuOpen(false); // Close mobile menu
                  if (item.onClick) {
                    e.preventDefault();
                    item.onClick();
                  }
                }}
                className={`flex items-center px-3 py-2 text-base font-medium
                  ${
                    isActive(item.href)
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 border-l-4 border-indigo-500 text-indigo-700 dark:text-indigo-400'
                      : 'border-l-4 border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <item.icon className="w-5 h-5 mr-2" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
