import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, Popover } from '@headlessui/react';
import { useGroups, groupApi, GroupHabit } from '../../contexts/GroupContext';
import { useUser } from '../../contexts/UserContext';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { HexColorPicker } from "react-colorful";
import { DEFAULT_CATEGORIES } from '../../types/habit';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';

interface GroupHabitFormProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  habitToEdit?: GroupHabit;
}

export default function GroupHabitForm({ isOpen, onClose, groupId, habitToEdit }: GroupHabitFormProps) {
  const [formData, setFormData] = useState({
    name: habitToEdit?.name || '',
    emoji: habitToEdit?.emoji || '📝',
    color: habitToEdit?.color || '#6366F1',
    category: habitToEdit?.category || DEFAULT_CATEGORIES[0].id,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useGroups();
  const { state: userState } = useUser();

  useEffect(() => {
    if (habitToEdit) {
      setFormData({
        name: habitToEdit.name,
        emoji: habitToEdit.emoji,
        color: habitToEdit.color || '#6366F1',
        category: habitToEdit.category || DEFAULT_CATEGORIES[0].id,
      });
    }
  }, [habitToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (habitToEdit) {
        const updatedHabit = await groupApi.updateHabit(
          groupId,
          {
            ...habitToEdit,
            ...formData,
            completions: habitToEdit.completions,
          },
          userState.profile!.id
        );

        dispatch({
          type: 'UPDATE_GROUP_HABIT',
          payload: { groupId, habit: updatedHabit }
        });
      } else {
        const newHabit = await groupApi.createHabit(
          groupId,
          {
            ...formData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          },
          userState.profile!.id
        );

        dispatch({
          type: 'ADD_GROUP_HABIT',
          payload: { groupId, habit: newHabit }
        });
      }

      onClose();
      setFormData({
        name: '',
        emoji: '📝',
        color: '#6366F1',
        category: DEFAULT_CATEGORIES[0].id,
      });
    } catch (error: any) {
      setError(error.message || `Failed to ${habitToEdit ? 'update' : 'create'} habit`);
    } finally {
      setIsLoading(false);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setFormData({ ...formData, emoji: emojiData.emoji });
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
              <Dialog.Panel className="relative w-full max-w-md transform overflow-visible rounded-3xl 
                                     bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl p-8 text-left shadow-2xl transition-all
                                     border border-white/20 dark:border-gray-800/30">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
                >
                  {habitToEdit ? 'Edit Group Habit' : 'Add Group Habit'}
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  <div className="flex gap-4">
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
                                   focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          {formData.emoji}
                        </Popover.Button>

                        <Popover.Panel className="absolute z-[100] mt-2">
                          <EmojiPicker
                            onEmojiClick={onEmojiClick}
                            theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT}
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
                              onChange={(color) => setFormData({ ...formData, color })}
                            />
                          </div>
                        </Popover.Panel>
                      </Popover>
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Habit Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-2 block w-full px-3 py-2 rounded-lg border-0 bg-white/50 dark:bg-gray-800/50 
                                 backdrop-blur-sm shadow-sm ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 
                                 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 transition-all"
                        placeholder="e.g., Daily Exercise"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category
                    </label>
                    <Listbox
                      value={formData.category}
                      onChange={(category) => setFormData({ ...formData, category })}
                    >
                      <div className="relative mt-2">
                        <Listbox.Button className="relative w-full px-3 py-2 rounded-lg border-0 
                                                 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white shadow-sm 
                                                 ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 focus:ring-2 
                                                 focus:ring-purple-500 transition-all text-left">
                          <span className="block truncate">
                            {DEFAULT_CATEGORIES.find(cat => cat.id === formData.category)?.name}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </span>
                        </Listbox.Button>
                        <Listbox.Options className="absolute z-[100] mt-1 max-h-60 w-full overflow-auto 
                                                  rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 
                                                  ring-black ring-opacity-5 focus:outline-none">
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

                  {error && (
                    <p className="text-red-500 text-sm">{error}</p>
                  )}

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
                      {isLoading ? (habitToEdit ? 'Updating...' : 'Creating...') : (habitToEdit ? 'Update Habit' : 'Create Habit')}
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