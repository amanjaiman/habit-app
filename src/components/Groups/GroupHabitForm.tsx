import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition, Popover } from "@headlessui/react";
import { useGroups, groupApi, GroupHabit } from "../../contexts/GroupContext";
import { useUser } from "../../contexts/UserContext";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { HexColorPicker } from "react-colorful";
import {
  DEFAULT_CATEGORIES,
  HabitType,
  NumericHabitConfig,
  RatingHabitConfig,
} from "../../types/habit";
import { Listbox } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";

const HABIT_TYPE_OPTIONS = [
  {
    id: HabitType.BOOLEAN,
    name: "Yes/No",
    description: "Simple completion tracking",
  },
  {
    id: HabitType.NUMERIC,
    name: "Numeric",
    description: "Track numbers like steps or minutes",
  },
  {
    id: HabitType.RATING,
    name: "Rating",
    description: "Rate on a scale (e.g., 1-5)",
  },
];

interface GroupHabitFormProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  habitToEdit?: GroupHabit;
}

export default function GroupHabitForm({
  isOpen,
  onClose,
  groupId,
  habitToEdit,
}: GroupHabitFormProps) {
  const [formData, setFormData] = useState({
    name: habitToEdit?.name || "",
    emoji: habitToEdit?.emoji || "📝",
    color: habitToEdit?.color || "#6366F1",
    category: habitToEdit?.category || DEFAULT_CATEGORIES[0].id,
    type: habitToEdit?.type || HabitType.BOOLEAN,
    config: habitToEdit?.config || null,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useGroups();
  const { state: userState } = useUser();
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: habitToEdit?.name || "",
        emoji: habitToEdit?.emoji || "📝",
        color: habitToEdit?.color || "#6366F1",
        category: habitToEdit?.category || DEFAULT_CATEGORIES[0].id,
        type: habitToEdit?.type || HabitType.BOOLEAN,
        config: habitToEdit?.config || null,
      });
      setIsEditMode(!!habitToEdit);
    }
  }, [habitToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (formData.type === HabitType.RATING) {
        const config = formData.config as RatingHabitConfig;
        if (
          typeof config.min !== "number" ||
          typeof config.max !== "number" ||
          typeof config.goal !== "number"
        ) {
          setError("Please fill in all rating fields with valid numbers");
          setIsLoading(false);
          return;
        }
        if (config.min >= config.max) {
          setError("Maximum rating must be greater than minimum rating");
          setIsLoading(false);
          return;
        }
        if (config.goal < config.min || config.goal > config.max) {
          setError("Goal must be between minimum and maximum ratings");
          setIsLoading(false);
          return;
        }
      }

      const habitData = {
        ...formData,
        emoji: formData.emoji || "📝",
        config:
          formData.type === HabitType.NUMERIC ||
          formData.type === HabitType.RATING
            ? formData.config
            : undefined,
      };

      if (habitToEdit) {
        const updatedHabit = await groupApi.updateHabit(
          groupId,
          {
            id: habitToEdit.id,
            name: habitData.name,
            emoji: habitData.emoji,
            color: habitData.color,
            type: habitData.type,
            category: habitData.category,
            createdAt: habitToEdit.createdAt,
            completions: habitToEdit.completions || [],
            config: habitData.config || undefined,
          },
          userState.profile!.id
        );

        dispatch({
          type: "UPDATE_GROUP_HABIT",
          payload: { groupId, habit: updatedHabit },
        });
      } else {
        const newHabit = await groupApi.createHabit(
          groupId,
          userState.profile!.id,
          habitData.name,
          habitData.emoji,
          habitData.type,
          habitData.config || undefined,
          habitData.color,
          habitData.category
        );

        dispatch({
          type: "ADD_GROUP_HABIT",
          payload: { groupId, habit: newHabit },
        });
      }

      onClose();
    } catch (error: any) {
      setError(
        error.message || `Failed to ${habitToEdit ? "update" : "create"} habit`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumericConfigChange = (
    field: keyof NumericHabitConfig,
    value: string
  ) => {
    const config = (formData.config as NumericHabitConfig) || {
      goal: 0,
      unit: "",
      higherIsBetter: true,
    };
    setFormData({
      ...formData,
      config: {
        ...config,
        [field]:
          field === "goal"
            ? parseFloat(value) || 0
            : field === "higherIsBetter"
            ? value === "true"
            : value,
      },
    });
  };

  const handleRatingConfigChange = (
    field: keyof RatingHabitConfig,
    value: string
  ) => {
    const config = (formData.config as RatingHabitConfig) || {
      min: 1,
      max: 5,
      goal: 3,
    };
    const numValue = value === "" ? "" : Number(value);

    let newConfig = {
      ...config,
      [field]: numValue,
    };

    if (typeof numValue === "number" && !isNaN(numValue)) {
      const goal = Number(newConfig.goal);

      if (field === "min" && goal < numValue) {
        newConfig.goal = numValue;
      } else if (field === "max" && goal > numValue) {
        newConfig.goal = numValue;
      }
    }

    setFormData({
      ...formData,
      config: newConfig,
    });
  };

  const handleTypeChange = (type: HabitType) => {
    setFormData({
      ...formData,
      type,
      config:
        type === HabitType.RATING
          ? { min: 1, max: 5, goal: 3 }
          : type === HabitType.NUMERIC
          ? { goal: 0, unit: "", higherIsBetter: true }
          : null,
    });
  };

  const renderConfigFields = () => {
    switch (formData.type) {
      case HabitType.NUMERIC:
        return (
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Goal
                </label>
                <input
                  type="number"
                  value={(formData.config as NumericHabitConfig)?.goal || ""}
                  onChange={(e) =>
                    handleNumericConfigChange("goal", e.target.value)
                  }
                  className="mt-2 block w-full px-3 py-2 rounded-lg border-0 bg-white/50 dark:bg-gray-800/50 
                            backdrop-blur-sm shadow-sm ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 
                            text-gray-900 dark:text-gray-100"
                  placeholder="e.g., 1000"
                  required
                />
              </div>
              <div className="h-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Higher is better
                </label>
                <div className="mt-[18px]">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        (formData.config as NumericHabitConfig)
                          ?.higherIsBetter ?? true
                      }
                      onChange={(e) =>
                        handleNumericConfigChange(
                          "higherIsBetter",
                          String(e.target.checked)
                        )
                      }
                      className="sr-only peer"
                    />
                    <div
                      className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 
                                  peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer 
                                  dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                                  peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                                  after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                                  after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"
                    ></div>
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Unit
              </label>
              <input
                type="text"
                value={(formData.config as NumericHabitConfig)?.unit || ""}
                onChange={(e) =>
                  handleNumericConfigChange("unit", e.target.value)
                }
                className="mt-2 block w-full px-3 py-2 rounded-lg border-0 bg-white/50 dark:bg-gray-800/50 
                          backdrop-blur-sm shadow-sm ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 
                          text-gray-900 dark:text-gray-100"
                placeholder="e.g., steps, minutes, pages"
                required
              />
            </div>
          </div>
        );

      case HabitType.RATING:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Minimum Rating
                </label>
                <input
                  type="number"
                  value={(formData.config as RatingHabitConfig)?.min ?? ""}
                  onChange={(e) =>
                    handleRatingConfigChange("min", e.target.value)
                  }
                  className="mt-2 block w-full px-3 py-2 rounded-lg border-0 bg-white/50 dark:bg-gray-800/50 
                            backdrop-blur-sm shadow-sm ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 
                            text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Maximum Rating
                </label>
                <input
                  type="number"
                  value={(formData.config as RatingHabitConfig)?.max ?? ""}
                  onChange={(e) =>
                    handleRatingConfigChange("max", e.target.value)
                  }
                  className="mt-2 block w-full px-3 py-2 rounded-lg border-0 bg-white/50 dark:bg-gray-800/50 
                            backdrop-blur-sm shadow-sm ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 
                            text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Goal Rating
                </label>
                <input
                  type="number"
                  value={(formData.config as RatingHabitConfig)?.goal ?? ""}
                  onChange={(e) =>
                    handleRatingConfigChange("goal", e.target.value)
                  }
                  className="mt-2 block w-full px-3 py-2 rounded-lg border-0 bg-white/50 dark:bg-gray-800/50 
                            backdrop-blur-sm shadow-sm ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 
                            text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className="relative w-full max-w-md transform overflow-visible rounded-3xl 
                                     bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl p-8 text-left shadow-2xl transition-all
                                     border border-white/20 dark:border-gray-800/30"
              >
                <Dialog.Title
                  as="h3"
                  className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
                >
                  {isEditMode ? "Edit Group Habit" : "Add Group Habit"}
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Habit Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="mt-2 block w-full px-3 py-2 rounded-lg border-0 bg-white/50 dark:bg-gray-800/50 
                          backdrop-blur-sm shadow-sm ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 
                          text-gray-900 dark:text-gray-100"
                        placeholder="e.g., Daily Exercise"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Emoji
                      </label>
                      <Popover className="relative mt-2">
                        <Popover.Button
                          className="flex items-center justify-center w-10 h-10 border border-gray-300 
                                   dark:border-gray-600 rounded-md shadow-sm text-sm font-medium 
                                   text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 
                                   hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none 
                                   focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {formData.emoji}
                        </Popover.Button>
                        <Popover.Panel className="absolute z-[100] mt-2">
                          <EmojiPicker
                            onEmojiClick={(emojiData: EmojiClickData) =>
                              setFormData({
                                ...formData,
                                emoji: emojiData.emoji,
                              })
                            }
                            theme={
                              document.documentElement.classList.contains(
                                "dark"
                              )
                                ? Theme.DARK
                                : Theme.LIGHT
                            }
                          />
                        </Popover.Panel>
                      </Popover>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Color
                      </label>
                      <Popover className="relative mt-2">
                        <Popover.Button
                          className="block w-10 h-10 rounded-lg shadow-sm cursor-pointer"
                          style={{ backgroundColor: formData.color }}
                        />
                        <Popover.Panel className="absolute z-[100] mt-2">
                          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                            <HexColorPicker
                              color={formData.color}
                              onChange={(color) =>
                                setFormData({ ...formData, color })
                              }
                            />
                          </div>
                        </Popover.Panel>
                      </Popover>
                    </div>
                  </div>

                  {!isEditMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Habit Type
                      </label>
                      <Listbox
                        value={formData.type}
                        onChange={handleTypeChange}
                      >
                        <div className="relative mt-2">
                          <Listbox.Button
                            className="relative w-full px-3 py-2 rounded-lg border-0 
                                                   bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white shadow-sm 
                                                   ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 focus:ring-2 
                                                   focus:ring-purple-500 transition-all text-left"
                          >
                            <span className="block truncate">
                              {
                                HABIT_TYPE_OPTIONS.find(
                                  (option) => option.id === formData.type
                                )?.name
                              }
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </span>
                          </Listbox.Button>
                          <Listbox.Options
                            className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto 
                                                    rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 
                                                    ring-black ring-opacity-5 focus:outline-none"
                          >
                            {HABIT_TYPE_OPTIONS.map((option) => (
                              <Listbox.Option
                                key={option.id}
                                value={option.id}
                                className={({ active }) => `
                                  relative cursor-pointer select-none py-2 px-4
                                  ${
                                    active
                                      ? "bg-purple-100 dark:bg-purple-900/30"
                                      : ""
                                  }
                                `}
                              >
                                {({ selected }) => (
                                  <div>
                                    <span
                                      className={`block truncate ${
                                        selected ? "font-semibold" : ""
                                      }`}
                                    >
                                      {option.name}
                                    </span>
                                    <span className="block truncate text-sm text-gray-500 dark:text-gray-400">
                                      {option.description}
                                    </span>
                                  </div>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>
                  )}

                  {renderConfigFields()}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category
                    </label>
                    <Listbox
                      value={formData.category}
                      onChange={(category) =>
                        setFormData({ ...formData, category })
                      }
                    >
                      <div className="relative mt-2">
                        <Listbox.Button
                          className="relative w-full px-3 py-2 rounded-lg border-0 
                                                 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white shadow-sm 
                                                 ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 focus:ring-2 
                                                 focus:ring-purple-500 transition-all text-left"
                        >
                          <span className="block truncate">
                            {
                              DEFAULT_CATEGORIES.find(
                                (cat) => cat.id === formData.category
                              )?.name
                            }
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          </span>
                        </Listbox.Button>
                        <Listbox.Options
                          className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto 
                                                  rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 
                                                  ring-black ring-opacity-5 focus:outline-none"
                        >
                          {DEFAULT_CATEGORIES.map((category) => (
                            <Listbox.Option
                              key={category.id}
                              value={category.id}
                              className={({ active }) => `
                                relative cursor-pointer select-none py-2 px-4 text-gray-900 dark:text-gray-100
                                ${
                                  active
                                    ? "bg-purple-100 dark:bg-purple-900/30"
                                    : ""
                                }
                              `}
                            >
                              {({ selected }) => (
                                <span
                                  className={`block truncate ${
                                    selected ? "font-semibold" : ""
                                  }`}
                                >
                                  {category.name}
                                </span>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                               hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !formData.name.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r 
                               from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                               rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 
                               focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading
                        ? isEditMode
                          ? "Updating..."
                          : "Creating..."
                        : isEditMode
                        ? "Update Habit"
                        : "Create Habit"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
