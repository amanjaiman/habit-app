import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Popover, PopoverPanel, PopoverButton, DialogTitle, DialogPanel, TransitionChild } from '@headlessui/react';
import { HexColorPicker } from "react-colorful";
import { useHabits, createHabit, habitApi } from '../contexts/HabitContext';
import { useUser } from '../contexts/UserContext';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Habit, DEFAULT_CATEGORIES } from '../types/habit';

interface HabitFormProps {
  isOpen: boolean;
  onClose: () => void;
  habitToEdit?: Habit;
}

export default function HabitForm({ isOpen, onClose, habitToEdit }: HabitFormProps) {
  const { dispatch } = useHabits();
  const { state: userState } = useUser();
  const [formData, setFormData] = useState({
    name: habitToEdit?.name || '',
    emoji: habitToEdit?.emoji || '',
    color: habitToEdit?.color || '#6366F1',
    category: habitToEdit?.category || DEFAULT_CATEGORIES[0].id,
  });

  useEffect(() => {
    if (habitToEdit) {
      setFormData({
        name: habitToEdit.name,
        emoji: habitToEdit.emoji,
        color: habitToEdit.color || '#6366F1',
        category: habitToEdit.category || DEFAULT_CATEGORIES[0].id,
      });
    } else if (!habitToEdit && isOpen) {
      setFormData({
        name: '',
        emoji: '',
        color: '#6366F1',
        category: DEFAULT_CATEGORIES[0].id,
      });
    }
  }, [habitToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userState.profile?.id) return;

    // Ensure we have an emoji, use a default if none selected
    const habitData = {
      ...formData,
      emoji: formData.emoji || '📝', // Default emoji
    };
    
    try {
      if (habitToEdit) {
        await habitApi.update(userState.profile.id, { ...habitToEdit, ...habitData });
        dispatch({
          type: 'UPDATE_HABIT',
          payload: {
            ...habitToEdit,
            ...habitData,
            createdAt: habitToEdit.createdAt,
            completions: habitToEdit.completions
          },
        });
      } else {
        const newHabit = await createHabit(userState.profile.id, habitData.name, habitData.emoji, habitData.color);
        dispatch({ type: 'ADD_HABIT', payload: newHabit });
      }
    } catch (error) {
      console.error('Failed to save habit:', error);
    }
    
    onClose();
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
                  {habitToEdit ? 'Edit Habit' : 'Create New Habit'}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category
                    </label>
                    <select
                      value={formData.category || 'other'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="mt-2 block w-full px-3 py-2 rounded-lg border-gray-300 dark:border-gray-600 
                                dark:bg-gray-700 text-gray-900 dark:text-white 
                                focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {DEFAULT_CATEGORIES.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
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
                      {habitToEdit ? 'Save Changes' : 'Create Habit'}
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
