import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGroups, groupApi, Group } from "../../contexts/GroupContext";
import { useUser } from "../../contexts/UserContext";
import GroupHabitForm from "./GroupHabitForm";
import GroupCalendar from "./GroupCalendar";
import toast from "react-hot-toast";
import GroupAchievements from "./GroupAchievements";
import GroupTrendChart from "./GroupTrendChart";
import GroupLeaderboard from "./GroupLeaderboard";
import GroupStats from "./GroupStats";
import GroupHabitList from "./GroupHabitList";

export default function GroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { state: groupState, dispatch } = useGroups();
  const { state: userState } = useUser();
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId || !userState.profile?.id) return;

      try {
        const fetchedGroup = await groupApi.fetchGroup(
          groupId,
          userState.profile.id
        );
        setGroup(fetchedGroup);
      } catch (err: any) {
        setError(err.message || "Failed to load group");
        if (err.status === 404) {
          navigate("/groups");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId, userState.profile?.id, navigate]);

  useEffect(() => {
    if (groupId && groupState.groups) {
      const updatedGroup = groupState.groups.find((g) => g.id === groupId);
      if (updatedGroup) {
        setGroup(updatedGroup);
      }
    }
  }, [groupState.groups, groupId]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group?.joinCode || "");
    toast.success("Join code copied to clipboard");
  };

  const handleDeleteGroup = async () => {
    if (!userState.profile) return;

    try {
      await groupApi.delete(group?.id || "", userState.profile.id);
      dispatch({ type: "DELETE_GROUP", payload: group?.id || "" });
      navigate("/groups");
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };

  const renderMemberInfo = () => {
    return (
      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          <div className="flex -space-x-2 mr-2">
            {group?.memberDetails.slice(0, 3).map((member) =>
              member.profileImage ? (
                <img
                  key={member.id}
                  src={member.profileImage}
                  alt={member.name}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                />
              ) : (
                <div
                  key={member.id}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 
                              bg-gradient-to-r from-purple-600 to-pink-600 
                              flex items-center justify-center text-white text-xs font-medium"
                >
                  {member.name[0].toUpperCase()}
                </div>
              )
            )}
            {group?.memberDetails.length && group?.memberDetails.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
                +{group?.memberDetails.length - 3}
              </div>
            )}
          </div>
          <span>{group?.memberDetails.length} members</span>
        </div>
        <span>•</span>
        <button
          onClick={handleCopyCode}
          className="font-mono font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 
                    bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer"
        >
          {group?.joinCode}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-8 lg:px-12">
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-white/30 dark:bg-gray-900/30 rounded-2xl"></div>
          <div className="h-64 bg-white/30 dark:bg-gray-900/30 rounded-2xl"></div>
        </div>
      </main>
    );
  }

  if (error || !group) {
    return (
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-8 lg:px-12">
        <div
          className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                      border border-white/20 dark:border-gray-800/30 shadow-xl text-center"
        >
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {error || "Group not found"}
          </p>
        </div>
      </main>
    );
  }

  const isAdmin = group.adminId === userState.profile?.id;

  return (
    <main className="max-w-7xl mx-auto py-6 px-4 sm:px-8 lg:px-12">
      <div className="space-y-8">
        {/* Header Section */}
        <div
          className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 
                      rounded-2xl p-8 border border-white/20 dark:border-gray-800/30 shadow-xl"
        >
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => navigate("/groups")}
                className="p-2 hover:bg-white/10 dark:hover:bg-gray-800/30 rounded-lg transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h1 className="sm:text-start text-4xl leading-[3rem] font-black flex items-center gap-2">
                  <span
                    className="bg-gradient-to-r from-purple-600 to-pink-600 
                            dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
                  >
                    {group.name}
                  </span>
                  <span className="mb-2">{group.emoji}</span>
                </h1>
                {group.description && (
                  <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                    {group.description}
                  </p>
                )}
                {renderMemberInfo()}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {group.habits.length > 0 && (
                <div className="lg:min-w-[300px]">
                  <GroupStats group={group} />
                </div>
              )}
            </div>
          </div>
        </div>

        {group.habits.length === 0 ? (
          <>
            <div
              className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                          border border-white/20 dark:border-gray-800/30 shadow-xl text-center"
            >
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {isAdmin
                  ? "No habits added yet. Create a habit to get started!"
                  : "No habits have been added to this group yet."}
              </p>
            </div>
            {/* Admin Habit Management Section */}
            {isAdmin && (
              <div
                className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                            border border-white/20 dark:border-gray-800/30 shadow-xl"
              >
                <GroupHabitList
                  habits={group.habits}
                  groupId={group.id}
                  isAdmin={isAdmin}
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* Group Progress Section */}
            <div
              className="relative z-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                          border border-white/20 dark:border-gray-800/30 shadow-xl"
            >
              <GroupCalendar group={group} />
            </div>

            {/* Trends Section */}
            <div
              className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                          border border-white/20 dark:border-gray-800/30 shadow-xl"
            >
              <h2
                className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 
                          dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
              >
                Completion Trends
              </h2>
              <GroupTrendChart group={group} />
            </div>

            {/* Achievements Section */}
            <div
              className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                          border border-white/20 dark:border-gray-800/30 shadow-xl"
            >
              <h2
                className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 
                          dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
              >
                Group Achievements
              </h2>
              <GroupAchievements group={group} />
            </div>

            {/* Leaderboard Section */}
            <div
              className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                          border border-white/20 dark:border-gray-800/30 shadow-xl"
            >
              <h2
                className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 
                          dark:from-purple-400 dark:to-pink-400 text-transparent bg-clip-text"
              >
                Leaderboard
              </h2>
              <GroupLeaderboard group={group} />
            </div>

            {/* Admin Habit Management Section */}
            {isAdmin && (
              <div
                className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                            border border-white/20 dark:border-gray-800/30 shadow-xl"
              >
                <GroupHabitList
                  habits={group.habits}
                  groupId={group.id}
                  isAdmin={isAdmin}
                />
              </div>
            )}
          </>
        )}

        {isAdmin && (
          <div
            className="backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 rounded-2xl p-8 
                        border border-white/20 dark:border-gray-800/30 shadow-xl"
          >
            <div>
              <h2 className="text-xl font-bold mb-4 text-red-500 dark:text-red-400">
                Danger Zone
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Once you delete a group, there is no going back. Please be
                certain.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg 
                         transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Delete Group
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              marginTop: "0px",
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl relative z-[101]">
              <h3 className="text-xl font-bold mb-4">Delete Group?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete "{group.name}"? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 
                           dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteGroup();
                    setShowDeleteConfirm(false);
                  }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg 
                           transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  Delete Group
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Habit Modal */}
        <GroupHabitForm
          isOpen={isHabitFormOpen}
          onClose={() => setIsHabitFormOpen(false)}
          groupId={group.id}
        />
      </div>
    </main>
  );
}
