import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Popover, PopoverPanel, PopoverButton, DialogTitle, DialogPanel, TransitionChild } from '@headlessui/react';
import { HexColorPicker } from "react-colorful";
import { useHabits, createHabit, habitApi } from '../contexts/HabitContext';
import { useUser } from '../contexts/UserContext';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Habit, DEFAULT_CATEGORIES, HabitType, NumericHabitConfig, RatingHabitConfig, HabitConfig } from '../types/habit';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';

interface HabitFormProps {
  isOpen: boolean;
  onClose: () => void;
  habitToEdit?: Habit;
}

const HABIT_TYPE_OPTIONS = [
  { id: HabitType.BOOLEAN, name: 'Yes/No', description: 'Simple completion tracking' },
  { id: HabitType.NUMERIC, name: 'Numeric', description: 'Track numbers like steps or minutes' },
  { id: HabitType.RATING, name: 'Rating', description: 'Rate on a scale (e.g., 1-5)' },
];

export default function HabitForm({ isOpen, onClose, habitToEdit }: HabitFormProps) {
  const { dispatch } = useHabits();
  const { state: userState } = useUser();
  const [formData, setFormData] = useState({
    name: habitToEdit?.name || '',
    emoji: habitToEdit?.emoji || '',
    color: habitToEdit?.color || '#6366F1',
    category: habitToEdit?.category || DEFAULT_CATEGORIES[0].id,
    type: habitToEdit?.type || HabitType.BOOLEAN,
    config: habitToEdit?.config || null,
  });
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsEditMode(!!habitToEdit);
    }
  }, [isOpen, habitToEdit]);

  useEffect(() => {
    if (isOpen) {  // Only update form data when the modal is opening
      setFormData({
        name: habitToEdit?.name || '',
        emoji: habitToEdit?.emoji || '',
        color: habitToEdit?.color || '#6366F1',
        category: habitToEdit?.category || DEFAULT_CATEGORIES[0].id,
        type: habitToEdit?.type || HabitType.BOOLEAN,
        config: habitToEdit?.config || null,
      });
    }
  }, [habitToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userState.profile?.id) return;

    // Validate rating config if present
    if (formData.type === HabitType.RATING) {
      const config = formData.config as RatingHabitConfig;
      if (typeof config.min !== 'number' || typeof config.max !== 'number' || typeof config.goal !== 'number') {
        alert('Please fill in all rating fields with valid numbers');
        return;
      }
      if (config.min >= config.max) {
        alert('Maximum rating must be greater than minimum rating');
        return;
      }
      if (config.goal < config.min || config.goal > config.max) {
        alert('Goal must be between minimum and maximum ratings');
        return;
      }
    }

    // Prepare habit data, ensuring config is properly handled
    const habitData = {
      ...formData,
      emoji: formData.emoji || '📝',
      // Only include config if it's needed for the habit type
      config: (formData.type === HabitType.NUMERIC || formData.type === HabitType.RATING) 
        ? formData.config 
        : undefined,
    };
    
    try {
      if (habitToEdit) {
        // For updates, make sure we preserve the original habit type and its config
        const updateData = {
          ...habitToEdit,
          ...habitData,
          type: habitToEdit.type, // Preserve the original habit type
          config: habitToEdit.type === HabitType.BOOLEAN ? undefined : habitData.config || undefined,
          createdAt: habitToEdit.createdAt,
          completions: habitToEdit.completions,
        };
        
        await habitApi.update(userState.profile.id, updateData);
        dispatch({
          type: 'UPDATE_HABIT',
          payload: updateData,
        });
      } else {
        const newHabit = await createHabit(
          userState.profile.id,
          habitData.name,
          habitData.emoji,
          habitData.type,
          habitData.config || undefined,
          habitData.color,
          habitData.category
        );
        dispatch({ type: 'ADD_HABIT', payload: newHabit });
      }
    } catch (error) {
      console.error('Failed to save habit:', error);
    }
    
    onClose();
  };

  const handleNumericConfigChange = (field: keyof NumericHabitConfig, value: string) => {
    const config = (formData.config as NumericHabitConfig) || { goal: 0, unit: '', higherIsBetter: true };
    setFormData({
      ...formData,
      config: {
        ...config,
        [field]: field === 'goal' 
          ? parseFloat(value) || 0 
          : field === 'higherIsBetter'
          ? value === 'true'
          : value
      }
    });
  };

  const handleRatingConfigChange = (field: keyof RatingHabitConfig, value: string) => {
    const config = (formData.config as RatingHabitConfig) || { min: 1, max: 5, goal: 5 };
    const numValue = value === '' ? '' : Number(value);
    
    let newConfig = {
      ...config,
      [field]: numValue
    };
    
    if (typeof numValue === 'number' && !isNaN(numValue)) {
      const min = Number(newConfig.min);
      const max = Number(newConfig.max);
      const goal = Number(newConfig.goal);

      if (field === 'min' && goal < numValue) {
        newConfig.goal = numValue;
      } else if (field === 'max' && goal > numValue) {
        newConfig.goal = numValue;
      }
    }

    setFormData({
      ...formData,
      config: newConfig
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
                  value={(formData.config as NumericHabitConfig)?.goal || ''}
                  onChange={(e) => handleNumericConfigChange('goal', e.target.value)}
                  className="mt-2 block w-full px-3 py-2 rounded-lg border-0 bg-white/50 dark:bg-gray-800/50 
                            backdrop-blur-sm shadow-sm ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 
                            text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div className='h-full'>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Higher is better
                </label>
                <div className="mt-[18px]">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.config as NumericHabitConfig)?.higherIsBetter ?? true}
                      onChange={(e) => handleNumericConfigChange('higherIsBetter', String(e.target.checked))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 
                                  peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer 
                                  dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                                  peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                                  after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                                  after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600">
                    </div>
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
                value={(formData.config as NumericHabitConfig)?.unit || ''}
                onChange={(e) => handleNumericConfigChange('unit', e.target.value)}
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
                  value={(formData.config as RatingHabitConfig)?.min ?? ''}
                  onChange={(e) => handleRatingConfigChange('min', e.target.value)}
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
                  value={(formData.config as RatingHabitConfig)?.max ?? ''}
                  onChange={(e) => handleRatingConfigChange('max', e.target.value)}
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
                  value={(formData.config as RatingHabitConfig)?.goal ?? ''}
                  onChange={(e) => handleRatingConfigChange('goal', e.target.value)}
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

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setFormData({ ...formData, emoji: emojiData.emoji });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="relative w-full max-w-md transform overflow-visible rounded-3xl 
                                     bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl p-8 text-left shadow-2xl transition-all
                                     border border-white/20 dark:border-gray-800/30">
                <DialogTitle
                  as="h3"
                  className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
                >
                  {isEditMode ? 'Edit Habit' : 'Create New Habit'}
                </DialogTitle>
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  <div className="flex gap-4">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Habit Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-2 block w-full px-3 py-2 rounded-lg border-0 bg-white/50 dark:bg-gray-800/50 
                                   backdrop-blur-sm shadow-sm ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 text-gray-900 dark:text-gray-100
                                   focus:ring-2 focus:ring-purple-500 transition-all"
                        placeholder="e.g., Go to the gym"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Emoji
                      </label>
                      <Popover className="relative mt-2">
                        <PopoverButton
                          className="flex items-center justify-center w-10 h-10 border border-gray-300 
                                   dark:border-gray-600 rounded-md shadow-sm text-sm font-medium 
                                   text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 
                                   hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none 
                                   focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {formData.emoji ? formData.emoji : '📝'}
                        </PopoverButton>

                        <PopoverPanel className="absolute z-[100] mt-2">
                          <EmojiPicker
                            onEmojiClick={onEmojiClick}
                            theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT}
                          />
                        </PopoverPanel>
                      </Popover>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Color
                      </label>
                      <div className="relative mt-2">
                        <Popover className="relative">
                          <PopoverButton className="block w-10 h-10 rounded-lg cursor-pointer" style={{ backgroundColor: formData.color }} />
                          <PopoverPanel className="absolute z-[100] mt-2">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                              <HexColorPicker color={formData.color} onChange={(color) => setFormData({ ...formData, color: color })} />
                            </div>
                          </PopoverPanel>
                        </Popover>
                      </div>
                      
                    </div>
                  </div>

                  {!isEditMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Habit Type
                      </label>
                      <Listbox value={formData.type} onChange={(type) => {
                        setFormData({
                          ...formData,
                          type,
                          config: type === HabitType.RATING 
                            ? { min: 1, max: 5, goal: 5 }
                            : type === HabitType.NUMERIC
                            ? { goal: 0, unit: '', higherIsBetter: true }
                            : null
                        });
                      }}>
                        <div className="relative mt-2">
                          <Listbox.Button className="relative w-full px-3 py-2 rounded-lg border-0 
                            bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white shadow-sm 
                            ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 focus:ring-2 
                            focus:ring-purple-500 transition-all text-left">
                            <span className="block truncate">
                              {HABIT_TYPE_OPTIONS.find(option => option.id === formData.type)?.name}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-300" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Listbox.Options className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto 
                            rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black 
                            ring-opacity-5 focus:outline-none">
                            {HABIT_TYPE_OPTIONS.map((option) => (
                              <Listbox.Option
                                key={option.id}
                                value={option.id}
                                className={({ active }) => `
                                  relative cursor-pointer select-none py-2 px-4
                                  ${active ? 'bg-purple-100 dark:bg-purple-900/30' : ''}
                                `}
                              >
                                {({ selected }) => (
                                  <div>
                                    <span className={`block truncate text-gray-900 dark:text-gray-100 ${selected ? 'font-semibold' : ''}`}>
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
                    <Listbox value={formData.category} onChange={(category) => setFormData({ ...formData, category })}>
                      <div className="relative mt-2">
                        <Listbox.Button className="relative w-full px-3 py-2 rounded-lg border-0 
                          bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white shadow-sm 
                          ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 focus:ring-2 
                          focus:ring-purple-500 transition-all text-left">
                          <span className="block truncate">
                            {DEFAULT_CATEGORIES.find(cat => cat.id === formData.category)?.name}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-300" aria-hidden="true" />
                          </span>
                        </Listbox.Button>
                        <Listbox.Options className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto 
                          rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black 
                          ring-opacity-5 focus:outline-none">
                          {DEFAULT_CATEGORIES.map((category) => (
                            <Listbox.Option
                              key={category.id}
                              value={category.id}
                              className={({ active }) => `
                                relative cursor-pointer select-none py-2 px-4 text-gray-900 dark:text-gray-100
                                ${active ? 'bg-purple-100 dark:bg-purple-900/30' : ''}
                              `}
                            >
                              {({ selected }) => (
                                <span className={`block truncate ${selected ? 'font-semibold' : ''}`}>
                                  {category.name}
                                </span>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  </div>

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
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 
                               hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 
                               focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {isEditMode ? 'Save Changes' : 'Create Habit'}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
