import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useHabits, habitApi } from '../contexts/HabitContext';
import { useUser, userApi } from '../contexts/UserContext';
import { Switch } from '@headlessui/react';
import {
  SunIcon,
  MoonIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { state, dispatch } = useHabits();
  const { state: userState, dispatch: userDispatch } = useUser();
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileImage, setProfileImage] = useState<string>(userState.profile?.profileImage || '');

  const handleExportData = async () => {
    if (!userState.profile?.id) return;

    try {
      const habits = await habitApi.fetch(userState.profile.id);
      const data = {
        habits,
        exportDate: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      
      if (exportUrl) {
        URL.revokeObjectURL(exportUrl);
      }
      
      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `habits-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userState.profile?.id) return;

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData.habits)) {
          // Update each habit through the API
          for (const habit of importedData.habits) {
            await habitApi.create(userState.profile!.id, habit);
          }
          dispatch({ type: 'IMPORT_HABITS', payload: importedData.habits });
        }
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to import data. Please check the file format.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (!userState.profile?.id) return;

    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      try {
        // Delete all habits through the API
        for (const habit of state.habits) {
          await habitApi.delete(userState.profile.id, habit.id);
        }
        dispatch({ type: 'RESET_DATA' });
      } catch (error) {
        console.error('Failed to reset data:', error);
      }
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userState.profile?.id) return;

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    try {
      await userApi.update(userState.profile.id, {
        ...userState.profile,
        password: newPassword,
      });

      userDispatch({
        type: 'UPDATE_PROFILE',
        payload: {
          ...userState,
          profile: {
            ...userState.profile,
            password: newPassword,
          }
        },
      });
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (error) {
      console.error('Failed to update password:', error);
      setPasswordError('Failed to update password. Please try again.');
    }
  };

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userState.profile?.id) return;

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      try {
        await userApi.update(userState.profile!.id, {
          ...userState.profile,
          profileImage: imageUrl,
        });

        setProfileImage(imageUrl);
        userDispatch({
          type: 'UPDATE_PROFILE',
          payload: {
            ...userState,
            profile: {
              ...userState.profile!,
              profileImage: imageUrl,
              id: userState.profile!.id
            }
          },
        });
      } catch (error) {
        console.error('Failed to update profile image:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePremiumStatus = async () => {
    if (!userState.profile?.id) return;

    try {
      const updatedProfile = {
        ...userState.profile,
        isPremium: !userState.profile.isPremium,
      };

      await userApi.update(userState.profile.id, updatedProfile);

      userDispatch({
        type: 'UPDATE_PROFILE',
        payload: {
          ...userState,
          profile: updatedProfile,
        },
      });
    } catch (error) {
      console.error('Failed to update premium status:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your preferences and data
        </p>
      </div>

      {/* Profile Settings */}
      <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 shadow-lg rounded-2xl divide-y divide-gray-200 dark:divide-gray-700">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Profile Settings
          </h2>
          
          {/* Profile Image */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-purple-200 dark:border-purple-900"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl font-medium">
                    {userState.name ? userState.name[0].toUpperCase() : '?'}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-purple-600 p-1.5 rounded-full cursor-pointer hover:bg-purple-700 transition-colors duration-200 shadow-lg">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </label>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Profile Picture</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Click the edit icon to change your profile picture
                </span>
              </div>
            </div>
          </div>

          {/* Password Change Form */}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="p-1 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="p-1 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
            )}
            <button
              type="submit"
              className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Change Password
            </button>
          </form>

          {/* Premium Status */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Premium Status</h3>
                <p className={`text-sm ${userState.profile?.isPremium ? 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                  {userState.profile?.isPremium ? 'Premium Member' : 'Free Plan'}
                </p>
              </div>
              <button
                onClick={handleTogglePremiumStatus}
                className={`inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                  userState.profile?.isPremium 
                    ? 'bg-gray-600 hover:bg-gray-700' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
              >
                {userState.profile?.isPremium ? 'Downgrade to Free' : 'Upgrade to Premium'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 shadow-lg rounded-2xl divide-y divide-gray-200 dark:divide-gray-700">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {theme === 'dark' ? (
                <MoonIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <SunIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
              <span className="text-gray-900 dark:text-white">Dark Mode</span>
            </div>
            <Switch
              checked={theme === 'dark'}
              onChange={toggleTheme}
              className={`${
                theme === 'dark' ? 'bg-purple-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>
        </div>

        {/* Data Management */}
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Data Management
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Export Data
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Download your habits and progress
                </p>
              </div>
              <button
                onClick={handleExportData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 
                         rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 
                         bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Export
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Import Data
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Restore from a backup file
                </p>
              </div>
              <label className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 
                              rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 
                              bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 
                              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 cursor-pointer">
                <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                Import
                <input
                  type="file"
                  className="hidden"
                  accept=".json"
                  onChange={handleImportData}
                />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Reset Data
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Clear all habits and progress
                </p>
              </div>
              <button
                onClick={handleResetData}
                className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-700 
                         rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-400 
                         bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
