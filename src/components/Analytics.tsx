import { useState, useMemo } from "react";
import { useHabits } from "../contexts/HabitContext";
import HabitCorrelation from "./Analytics/HabitCorrelation";
import AnalyticsSummary from "./Analytics/AnalyticsSummary";
import BehaviorChainAnalysis from "./Analytics/BehaviorChainAnalysis";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import {
  ArrowsPointingOutIcon,
  DocumentTextIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { Listbox } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { useAnalytics } from "../contexts/AnalyticsContext";
import { useUserPremium } from "../hooks/useUserPremium";
import { useGroups } from "../contexts/GroupContext";

export default function Analytics() {
  const { state: analyticsState } = useAnalytics();
  const { premium } = useUserPremium();
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const { state } = useHabits();
  const { state: groupState } = useGroups();

  // Combine personal and group habits
  const allHabits = useMemo(() => {
    const personalHabits = state.habits;
    const groupHabits = groupState.groups.flatMap((group) =>
      group.habits.map((habit) => ({
        ...habit,
        isGroupHabit: true,
        groupName: group.name,
        groupId: group.id,
      }))
    );
    return [...personalHabits, ...groupHabits];
  }, [state.habits, groupState.groups]);

  if (analyticsState.loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (analyticsState.error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        Error loading analytics: {analyticsState.error}
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto pt-0 sm:pt-6 pb-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div
          className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-none sm:rounded-2xl px-4 sm:px-8 py-4 sm:py-8 
                      border-x-0 sm:border border-white/20 dark:border-gray-800/30 shadow-xl flex sm:block flex-col items-center
                      relative mx-0 sm:mx-8 lg:mx-12"
        >
          <h1
            className="sm:text-start text-3xl sm:text-4xl !leading-[3rem] font-black bg-gradient-to-r from-purple-600 to-pink-600 
                        dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
          >
            Analytics
          </h1>
          <p className="hidden sm:block mt-2 text-gray-600 dark:text-gray-300 text-base sm:text-lg font-medium">
            Gain insights into your habit-building journey
          </p>
        </div>

        <div className="px-4 sm:px-8 lg:px-12 space-y-6 sm:space-y-8">
          {allHabits.length === 0 && (
            <div
              className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                            border border-white/20 dark:border-gray-800/30 shadow-xl text-center text-gray-600 dark:text-gray-300 text-lg"
            >
              No habits found. Add a habit on the dashboard to get started.
            </div>
          )}

          {/* Habit Selector */}
          {allHabits.length > 0 && (
            <div
              className="relative z-[200] backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-xl p-6 
                        border border-white/20 dark:border-gray-800/30 shadow-lg"
            >
              <Listbox
                value={selectedHabitId || ""}
                onChange={setSelectedHabitId}
              >
                <div className="relative z-[200]">
                  <Listbox.Button
                    className="relative w-full px-4 py-3 rounded-xl border-0 
                    bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white shadow-sm 
                    ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 focus:ring-2 
                    focus:ring-purple-500 transition-all text-left"
                  >
                    <span className="block truncate">
                      {selectedHabitId
                        ? `${
                            allHabits.find((h) => h.id === selectedHabitId)?.emoji
                          } ${
                            allHabits.find((h) => h.id === selectedHabitId)?.name
                          }`
                        : "All Habits"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon
                        className="h-5 w-5 text-gray-300"
                        aria-hidden="true"
                      />
                    </span>
                  </Listbox.Button>
                  <Listbox.Options
                    className="absolute z-[200] mt-1 max-h-60 w-full overflow-auto 
                    rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black 
                    ring-opacity-5 focus:outline-none"
                  >
                    <Listbox.Option
                      value=""
                      className={({ active }) => `
                        relative cursor-pointer select-none py-2 pl-4 pr-9 text-gray-900 dark:text-gray-100
                        ${active ? "bg-purple-100 dark:bg-purple-900/30" : ""}
                      `}
                    >
                      {({ selected }) => (
                        <span
                          className={`block truncate ${
                            selected ? "font-semibold" : ""
                          }`}
                        >
                          All Habits
                        </span>
                      )}
                    </Listbox.Option>
                    {allHabits.map((habit) => (
                      <Listbox.Option
                        key={habit.id}
                        value={habit.id}
                        className={({ active, disabled }) => `
                          relative cursor-pointer select-none py-2 pl-4 pr-9 text-gray-900 dark:text-gray-100
                          ${active ? "bg-purple-100 dark:bg-purple-900/30" : ""}
                          ${disabled ? "cursor-not-allowed opacity-50" : ""}
                        `}
                      >
                        {({ selected }) => (
                          <span
                            className={`flex items-center gap-3 ${
                              selected ? "font-semibold" : ""
                            }`}
                          >
                            {habit.emoji} {habit.name}
                            {"isGroupHabit" in habit && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({habit.groupName})
                              </span>
                            )}
                          </span>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            </div>
          )}

          {/* Content */}
          {allHabits.length > 0 && (
            <div className="relative z-0">
              {!selectedHabitId ? (
                // Show overview analytics when no specific habit is selected
                <div className="space-y-8">
                  <AnalyticsSummary habitId="all" />
                </div>
              ) : (
                // Show specific habit analytics when a habit is selected
                <div className="space-y-8">
                  <TabGroup>
                    <TabList
                      className="relative z-0 flex space-x-2 p-1 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 
                                  rounded-xl border border-white/20 dark:border-gray-800/30 shadow-lg"
                    >
                      {[
                        {
                          icon: <AcademicCapIcon className="w-5 h-5 mr-2" />,
                          name: "Summary",
                          disabled: false,
                        },
                        {
                          icon: premium ? (
                            <ArrowsPointingOutIcon className="w-5 h-5 mr-2" />
                          ) : (
                            <LockClosedIcon
                              className="w-5 h-5 mr-2 fill-purple-600 dark:fill-purple-400"
                              aria-hidden="true"
                            />
                          ),
                          name: "Correlations",
                          disabled: !premium,
                        },
                        {
                          icon: premium ? (
                            <DocumentTextIcon className="w-5 h-5 mr-2" />
                          ) : (
                            <LockClosedIcon
                              className="w-5 h-5 mr-2 fill-purple-600 dark:fill-purple-400"
                              aria-hidden="true"
                            />
                          ),
                          name: "Behavior Analysis",
                          disabled: !premium,
                        },
                      ].map((tab) => (
                        <Tab
                          key={tab.name}
                          disabled={tab.disabled}
                          className={({ selected }) =>
                            `flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg
                          transition-all duration-200 ${
                            selected
                              ? "bg-white/50 dark:bg-gray-800/90 text-purple-600 dark:text-purple-400 shadow-sm"
                              : "text-gray-600 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-800/30"
                          }`
                          }
                        >
                          {tab.icon}
                          <div className="hidden sm:flex">{tab.name}</div>
                        </Tab>
                      ))}
                    </TabList>

                    <TabPanels className="relative z-0 mt-6">
                      <TabPanel>
                        <AnalyticsSummary habitId={selectedHabitId} />
                      </TabPanel>
                      <TabPanel>
                        <HabitCorrelation habitId={selectedHabitId} />
                      </TabPanel>
                      <TabPanel>
                        <BehaviorChainAnalysis habitId={selectedHabitId} />
                      </TabPanel>
                    </TabPanels>
                  </TabGroup>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
