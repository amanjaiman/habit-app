import { useState } from 'react';
import { Group, GroupHabit } from '../../contexts/GroupContext';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

interface GroupCalendarProps {
  group: Group;
}

export default function GroupCalendar({ group }: GroupCalendarProps) {
  const [currentDate] = useState(new Date());
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

  // Calculate completion percentages for each day
  const dailyStats = weekDays.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const statsForDay = group.habits.map(habit => {
      const completionsForDay = habit.completions.filter(
        c => c.date === dateStr && c.completed
      );
      return {
        habitId: habit.id,
        completionRate: (completionsForDay.length / group.members.length) * 100
      };
    });

    const averageCompletion = statsForDay.reduce(
      (acc, curr) => acc + curr.completionRate, 0
    ) / group.habits.length;

    return {
      date,
      dateStr,
      stats: statsForDay,
      averageCompletion
    };
  });

  // Calculate member stats for the week
  const memberStats = group.memberDetails.map(member => {
    const completions = weekDays.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const completedHabits = group.habits.filter(habit =>
        habit.completions.some(c => 
          c.userId === member.id && 
          c.date === dateStr && 
          c.completed
        )
      );
      return {
        date,
        completedCount: completedHabits.length,
        totalHabits: group.habits.length
      };
    });

    const weeklyCompletionRate = completions.reduce(
      (acc, day) => acc + (day.completedCount / day.totalHabits), 0
    ) / 7 * 100;

    return {
      member,
      completions,
      weeklyCompletionRate
    };
  });

  return (
    <div className="space-y-6">
      {/* Weekly Overview */}
      <div className="grid grid-cols-7 gap-2">
        {dailyStats.map(({ date, averageCompletion }) => (
          <div 
            key={format(date, 'yyyy-MM-dd')}
            className="text-center"
          >
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {format(date, 'EEE')}
            </div>
            <div className="mt-1 relative pt-1">
              <div className="flex items-end overflow-hidden h-16 rounded-lg bg-white/50 dark:bg-gray-900/50">
                <div
                  className="h-full w-full bg-gradient-to-b from-purple-500/90 to-pink-500/90"
                  style={{ height: `${averageCompletion}%` }}
                />
              </div>
              <div className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                {Math.round(averageCompletion)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Member Progress */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Member Progress
        </h3>
        <div className="space-y-3">
          {memberStats.map(({ member, weeklyCompletionRate, completions }) => (
            <div 
              key={member.id}
              className="flex items-center space-x-4 p-4 rounded-xl border border-white/20 
                       dark:border-gray-800/30 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30"
            >
              {member.profileImage ? (
                <img
                  src={member.profileImage}
                  alt={`${member.name}'s profile`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 
                              flex items-center justify-center text-white text-sm font-medium">
                  {member.name[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {member.name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(weeklyCompletionRate)}% this week
                  </span>
                </div>
                <div className="mt-2 flex gap-1">
                  {completions.map(({ date, completedCount, totalHabits }) => (
                    <div
                      key={format(date, 'yyyy-MM-dd')}
                      className="flex-1 h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700"
                    >
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${(completedCount / totalHabits) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 