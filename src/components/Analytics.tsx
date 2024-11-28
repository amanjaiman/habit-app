import { useState, useEffect } from 'react';
import { useHabits } from '../contexts/HabitContext';
import TrendChart from './Analytics/TrendChart';
import HabitCorrelation from './Analytics/HabitCorrelation';
import AnalyticsSummary from './Analytics/AnalyticsSummary';
import BehaviorChainAnalysis from './Analytics/BehaviorChainAnalysis';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import {
  ChartBarIcon,
  ArrowsPointingOutIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { useUser } from '../contexts/UserContext';

export default function Analytics() {
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const { state } = useHabits();
  const { state: userState } = useUser();

  useEffect(() => {
    if (!userState.profile?.isPremium && selectedHabitId) {
      setSelectedHabitId(null);
    }
  }, [userState.profile?.isPremium]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                    border border-white/20 dark:border-gray-800/30 shadow-xl">
        <h1 className="text-4xl leading-[3rem] font-black bg-gradient-to-r from-purple-600 to-pink-600 
                     dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text">
          Analytics
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 text-lg">
          Gain insights into your habit-building journey
        </p>
      </div>

      {/* Habit Selector */}
      <div className="relative z-[200] backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-xl p-6 
                    border border-white/20 dark:border-gray-800/30 shadow-lg">
        <Listbox value={selectedHabitId || ''} onChange={setSelectedHabitId}>
          <div className="relative z-[200]">
            <Listbox.Button className="relative w-full px-4 py-3 rounded-xl border-0 
              bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white shadow-sm 
              ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 focus:ring-2 
              focus:ring-purple-500 transition-all text-left">
              <span className="block truncate">
                {selectedHabitId 
                  ? `${state.habits.find(h => h.id === selectedHabitId)?.emoji} ${state.habits.find(h => h.id === selectedHabitId)?.name}`
                  : 'All Habits'}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Listbox.Options className="absolute z-[200] mt-1 max-h-60 w-full overflow-auto 
              rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black 
              ring-opacity-5 focus:outline-none">
              <Listbox.Option
                value=""
                className={({ active }) => `
                  relative cursor-pointer select-none py-2 pl-4 pr-9
                  ${active ? 'bg-purple-100 dark:bg-purple-900/30' : ''}
                `}
              >
                {({ selected }) => (
                  <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                    All Habits
                  </span>
                )}
              </Listbox.Option>
              {state.habits.map((habit) => (
                <Listbox.Option
                  key={habit.id}
                  value={habit.id}
                  disabled={!userState.profile?.isPremium}
                  className={({ active, disabled }) => `
                    relative cursor-pointer select-none py-2 pl-4 pr-9
                    ${active ? 'bg-purple-100 dark:bg-purple-900/30' : ''}
                    ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                  `}
                >
                  {({ selected }) => (
                    <span className={`flex items-center gap-3 ${selected ? 'font-semibold' : ''}`}>
                      {!userState.profile?.isPremium && (
                        <span className="py-1 px-1.5 rounded bg-gradient-to-r from-purple-600 to-pink-600 text-xs text-white font-medium">
                          PREMIUM
                        </span>
                      )}
                      {habit.emoji} {habit.name}
                    </span>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
      </div>

      {/* Content */}
      <div className="relative z-0">
        {!selectedHabitId ? (
          // Show overview analytics when no specific habit is selected
          <div className="space-y-8">
            <AnalyticsSummary habitId="all" isPremium={userState.profile?.isPremium} />
            {userState.profile?.isPremium && <TrendChart habitId="all" />}
          </div>
        ) : (
          // Show specific habit analytics when a habit is selected
          <TabGroup>
            <TabList className="relative z-0 flex space-x-2 p-1 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 
                             rounded-xl border border-white/20 dark:border-gray-800/30 shadow-lg">
              {[
                { icon: AcademicCapIcon, name: 'Summary' },
                { icon: ArrowsPointingOutIcon, name: 'Correlations' },
                { icon: DocumentTextIcon, name: 'Behavior Analysis' },
              ].map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    `flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg
                     transition-all duration-200 ${
                      selected
                        ? 'bg-white/50 dark:bg-gray-800/50 text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/30 dark:hover:bg-gray-800/30'
                    }`
                  }
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </Tab>
              ))}
            </TabList>

            <TabPanels className="relative z-0 mt-6">
              <TabPanel>
                <AnalyticsSummary habitId={selectedHabitId} isPremium={userState.profile?.isPremium} />
              </TabPanel>
              <TabPanel>
                <HabitCorrelation habitId={selectedHabitId} />
              </TabPanel>
              <TabPanel>
                <BehaviorChainAnalysis habitId={selectedHabitId} />
              </TabPanel>
            </TabPanels>
          </TabGroup>
        )}
      </div>
    </div>
  );
}
