import React, { createContext, useContext, useEffect, useState } from 'react';

interface HabitDisplayContextType {
  groupHabits: boolean;
  toggleGroupHabits: () => void;
}

const HabitDisplayContext = createContext<HabitDisplayContextType | undefined>(undefined);

export function HabitDisplayProvider({ children }: { children: React.ReactNode }) {
  const [groupHabits, setGroupHabits] = useState(() => {
    const stored = localStorage.getItem('habitGrouping');
    return stored ? JSON.parse(stored) : false; // Default to false
  });

  useEffect(() => {
    localStorage.setItem('habitGrouping', JSON.stringify(groupHabits));
  }, [groupHabits]);

  const toggleGroupHabits = () => {
    setGroupHabits((prev: any) => !prev);
  };

  return (
    <HabitDisplayContext.Provider value={{ groupHabits, toggleGroupHabits }}>
      {children}
    </HabitDisplayContext.Provider>
  );
}

export function useHabitDisplay() {
  const context = useContext(HabitDisplayContext);
  if (context === undefined) {
    throw new Error('useHabitDisplay must be used within a HabitDisplayProvider');
  }
  return context;
} 