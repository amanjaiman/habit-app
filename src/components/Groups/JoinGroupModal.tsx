import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useGroups, groupApi } from "../../contexts/GroupContext";
import { useUser } from "../../contexts/UserContext";

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinGroupModal({
  isOpen,
  onClose,
}: JoinGroupModalProps) {
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useGroups();
  const { state: userState } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await groupApi.join(joinCode, userState.profile!.id);
      // Refresh groups list
      const updatedGroups = await groupApi.fetch(userState.profile!.id);
      dispatch({ type: "SET_GROUPS", payload: updatedGroups });
      onClose();
      // Reset form
      setJoinCode("");
    } catch (error: any) {
      setError(error.message || "Failed to join group");
    } finally {
      setIsLoading(false);
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
                  Join a Group
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  <div>
                    <label
                      htmlFor="joinCode"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Enter Join Code
                    </label>
                    <input
                      type="text"
                      id="joinCode"
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter 6-digit code"
                      className="mt-2 block w-full px-3 py-2 rounded-lg border-0 bg-white/50 dark:bg-gray-800/50 
                               backdrop-blur-sm shadow-sm ring-1 ring-inset ring-gray-300/50 dark:ring-gray-700/50 
                               text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 transition-all"
                      maxLength={6}
                    />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Ask your friend for their group's join code
                    </p>
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
                      disabled={isLoading || joinCode.length !== 6}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r 
                               from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                               rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 
                               focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Joining..." : "Join Group"}
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
