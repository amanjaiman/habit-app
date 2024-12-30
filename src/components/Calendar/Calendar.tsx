import { useEffect, useState } from 'react';
import { format, addDays, addWeeks, addMonths, startOfDay, startOfWeek, parseISO } from 'date-fns';
import { useHabits } from '../../contexts/HabitContext';
import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { useUser } from '../../contexts/UserContext';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { useUserPremium } from '../../hooks/useUserPremium';

type ViewType = 'day' | 'week' | 'month';

const viewOptions = [
  { id: 'day', name: 'Day', premium: false },
  { id: 'week', name: 'Week', premium: true },
  { id: 'month', name: 'Month', premium: true },
] as const;

export default function Calendar() {
  const { state: userState } = useUser();
  const { premium } = useUserPremium();
  const { state } = useHabits();
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [viewType, setViewType] = useState<ViewType>('day');

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const weekStart = startOfWeek(parseISO(dateStr), { weekStartsOn: 1 });
  

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(current => {
      switch (viewType) {
        case 'day':
          return direction === 'next' ? addDays(current, 1) : addDays(current, -1);
        case 'week':
          return direction === 'next' ? addWeeks(current, 1) : addWeeks(current, -1);
        case 'month':
          return direction === 'next' ? addMonths(current, 1) : addMonths(current, -1);
        default:
          return current;
      }
    });
  };

  const setView = (view: ViewType) => {
    if (premium) {
      localStorage.setItem('view', view);
      setViewType(view);
    }
  };

  const resetToToday = () => {
    setCurrentDate(startOfDay(new Date()));
  };

  const renderView = () => {
    switch (viewType) {
      case 'day':
        return <DayView date={dateStr} habits={state.habits} />;
      case 'week':
        return <WeekView startDate={dateStr} habits={state.habits} />;
      case 'month':
        return <MonthView date={dateStr} habits={state.habits} />;
    }
  };

  const getViewTitle = () => {
    switch (viewType) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        return `Week of ${format(weekStart, 'MMMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
    }
  };

  // Load habits from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem('view');
    if (savedView) {
      setView(savedView as ViewType);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between backdrop-blur-sm bg-white/30 
                    dark:bg-gray-900/30 rounded-xl p-4 sm:p-6 border border-white/20 
                    dark:border-gray-800/30 shadow-lg relative z-[200]">
        <div className="flex items-center space-y-0 space-x-4">
          <Listbox value={viewType} onChange={setView}>
            <div className="relative z-[200]">
              <Listbox.Button className="relative w-40 px-4 py-2 rounded-lg border-0 
                bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white shadow-sm 
                ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 focus:ring-2 
                focus:ring-purple-500 transition-all text-left">
                <span className="block truncate">
                  {viewOptions.find(opt => opt.id === viewType)?.name}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-300" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Listbox.Options className="absolute z-[200] mt-1 max-h-60 w-full overflow-auto 
                rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black 
                ring-opacity-5 focus:outline-none">
                {viewOptions.map((option) => (
                  <Listbox.Option
                    key={option.id}
                    value={option.id}
                    disabled={option.premium && !premium}
                    className={({ active, disabled }) => `
                      relative cursor-pointer select-none py-2 px-4 text-gray-900 dark:text-gray-100
                      ${active ? 'bg-purple-100 dark:bg-purple-900/30' : ''}
                      ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                    `}
                  >
                    {({ selected }) => (
                      <>
                        <span className={`flex items-center justify-between ${selected ? 'font-semibold' : ''}`}>
                          {option.name}
                          {option.premium && !premium && (
                            <span className="ml-2">
                              <LockClosedIcon className="h-5 w-5 fill-purple-600 dark:fill-purple-400" aria-hidden="true" />
                            </span>
                          )}
                        </span>
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>

          <button
            onClick={resetToToday}
            className="inline-flex items-center px-4 py-2.5 bg-white/50 dark:bg-gray-800/50 
                     rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 
                     hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-200 
                     shadow-sm ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50"
          >
            <CalendarDaysIcon className="w-4 h-4 mr-2" />
            Today
          </button>
        </div>

        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <button
            onClick={() => navigate('prev')}
            className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 
                     text-gray-600 dark:text-gray-300 transition-all duration-200"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white px-4">
            {getViewTitle()}
          </h2>
          <button
            onClick={() => navigate('next')}
            className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 
                     text-gray-600 dark:text-gray-300 transition-all duration-200"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-xl 
                    border border-white/20 dark:border-gray-800/30 shadow-xl overflow-hidden">
        {renderView()}
      </div>
    </div>
  );
} 