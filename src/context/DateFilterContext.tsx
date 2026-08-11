import React, { createContext, useContext, useState } from 'react';

export type TimeframeMode = 'day' | 'week' | 'month' | 'all';

interface DateFilterContextType {
  timeframe: TimeframeMode;
  setTimeframe: (mode: TimeframeMode) => void;
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  handlePrevDate: () => void;
  handleNextDate: () => void;
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

const getSystemTodayStr = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const DateFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timeframe, setTimeframeState] = useState<TimeframeMode>(() => {
    const saved = localStorage.getItem('saheb_selected_timeframe');
    if (saved === 'day' || saved === 'week' || saved === 'month' || saved === 'all') return saved;
    return 'day';
  });

  const [selectedDate, setSelectedDateState] = useState<string>(() => {
    const todayStr = getSystemTodayStr();
    const savedDate = localStorage.getItem('saheb_selected_date');
    if (savedDate && savedDate === todayStr) {
      return savedDate;
    }
    localStorage.setItem('saheb_selected_date', todayStr);
    return todayStr;
  });

  const setTimeframe = (mode: TimeframeMode) => {
    setTimeframeState(mode);
    localStorage.setItem('saheb_selected_timeframe', mode);
  };

  const handleSetSelectedDate = (date: string) => {
    const todayStr = getSystemTodayStr();
    const finalDate = date > todayStr ? todayStr : date;
    setSelectedDateState(finalDate);
    localStorage.setItem('saheb_selected_date', finalDate);
  };

  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    if (isNaN(d.getTime())) return;
    if (timeframe === 'day') d.setDate(d.getDate() - 1);
    else if (timeframe === 'week') d.setDate(d.getDate() - 7);
    else if (timeframe === 'month') d.setMonth(d.getMonth() - 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const prevStr = `${yyyy}-${mm}-${dd}`;
    handleSetSelectedDate(prevStr);
  };

  const handleNextDate = () => {
    const todayStr = getSystemTodayStr();
    if (selectedDate >= todayStr) return;

    const d = new Date(selectedDate);
    if (isNaN(d.getTime())) return;
    if (timeframe === 'day') d.setDate(d.getDate() + 1);
    else if (timeframe === 'week') d.setDate(d.getDate() + 7);
    else if (timeframe === 'month') d.setMonth(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const nextStr = `${yyyy}-${mm}-${dd}`;
    
    handleSetSelectedDate(nextStr);
  };

  return (
    <DateFilterContext.Provider
      value={{
        timeframe,
        setTimeframe,
        selectedDate,
        setSelectedDate: handleSetSelectedDate,
        handlePrevDate,
        handleNextDate,
      }}
    >
      {children}
    </DateFilterContext.Provider>
  );
};

export const useDateFilter = () => {
  const context = useContext(DateFilterContext);
  if (!context) {
    throw new Error('useDateFilter must be used within a DateFilterProvider');
  }
  return context;
};
