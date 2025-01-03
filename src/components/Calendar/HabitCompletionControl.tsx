import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  Habit,
  HabitType,
  NumericHabitConfig,
  RatingHabitConfig,
} from "../../types/habit";
import { GroupHabit } from "../../contexts/GroupContext";

interface HabitCompletionControlProps {
  isOpen: boolean;
  onClose: () => void;
  habit?: Habit | GroupHabit;
  value: boolean | number;
  onSubmit: (value: number) => void;
}

export default function HabitCompletionControl({
  isOpen,
  onClose,
  habit,
  value,
  onSubmit,
}: HabitCompletionControlProps) {
  if (!habit) return null;

  const numericConfig =
    habit.type === HabitType.NUMERIC
      ? (habit.config as NumericHabitConfig)
      : undefined;
  const ratingConfig =
    habit.type === HabitType.RATING
      ? (habit.config as RatingHabitConfig)
      : undefined;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={(event) => {
          // Only close if Escape key is pressed
          if (event === undefined) {
            onClose();
          }
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className="w-full max-w-md transform overflow-hidden rounded-2xl 
                          bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    {habit.name}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-4">
                  {habit.type === HabitType.NUMERIC && numericConfig && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {numericConfig.unit}
                        </label>
                        <input
                          id="numeric-input"
                          type="number"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              onSubmit(
                                parseFloat(
                                  (e.target as HTMLInputElement).value
                                ) || 0
                              );
                              onClose();
                            }
                          }}
                          className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-white 
                                    shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 
                                    placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-600 
                                    dark:bg-gray-700"
                          placeholder={`${numericConfig?.goal}`}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Goal: {numericConfig.goal} {numericConfig.unit}
                        </div>
                        <button
                          onClick={() => {
                            const input = document.getElementById(
                              "numeric-input"
                            ) as HTMLInputElement;
                            onSubmit(parseFloat(input?.value || "0") || 0);
                            onClose();
                          }}
                          className="rounded-md bg-purple-600 px-3.5 py-2 text-sm font-semibold text-white 
                                    shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 
                                    focus-visible:outline-offset-2 focus-visible:outline-purple-600"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  {habit.type === HabitType.RATING && ratingConfig && (
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Rating
                      </label>
                      <div className="flex justify-center gap-2">
                        {Array.from(
                          { length: ratingConfig.max - ratingConfig.min + 1 },
                          (_, i) => i + ratingConfig.min
                        ).map((rating) => (
                          <button
                            key={rating}
                            onClick={() => onSubmit(rating)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium
                                      transition-all duration-200
                                      ${
                                        value === rating
                                          ? "bg-purple-600 text-white"
                                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                                      }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
