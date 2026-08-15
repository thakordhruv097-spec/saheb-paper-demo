import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export type TimeframeMode = 'day' | 'week' | 'month' | 'all';

interface DateFilterContextType {
  timeframe: TimeframeMode;
  setTimeframe: (mode: TimeframeMode) => void;
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  handlePrevDate: () => void;
  handleNextDate: () => void;
  systemToday: string; // YYYY-MM-DD (actual current system date)
  dateTick: number; // Increments on date change / midnight rollover
}

const DateFilterContext = createContext<DateFilterContextType | undefined>(undefined);

export const getSystemTodayStr = (): string => {
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

  const [systemToday, setSystemToday] = useState<string>(() => getSystemTodayStr());
  const [dateTick, setDateTick] = useState<number>(0);

  const [selectedDate, setSelectedDateState] = useState<string>(() => {
    const todayStr = getSystemTodayStr();
    const savedDate = localStorage.getItem('saheb_selected_date');
    if (savedDate && savedDate === todayStr) {
      return savedDate;
    }
    localStorage.setItem('saheb_selected_date', todayStr);
    return todayStr;
  });

  const lastKnownTodayRef = useRef<string>(systemToday);

  // Background midnight checker: runs every 15 seconds + on window focus / tab visibility change
  useEffect(() => {
    const checkDateRollover = () => {
      const currentSystemToday = getSystemTodayStr();
      const lastKnown = lastKnownTodayRef.current;

      if (currentSystemToday !== lastKnown) {
        lastKnownTodayRef.current = currentSystemToday;
        setSystemToday(currentSystemToday);

        // If selectedDate was pointing to the previous "Today" (or user was on 'day' timeframe),
        // automatically advance selectedDate to the new day!
        setSelectedDateState((prevSelected) => {
          if (prevSelected === lastKnown || timeframe === 'day') {
            localStorage.setItem('saheb_selected_date', currentSystemToday);
            return currentSystemToday;
          }
          return prevSelected;
        });

        setDateTick((prev) => prev + 1);

        // Broadcast global midnight event for any non-React listeners
        window.dispatchEvent(
          new CustomEvent('saheb_date_changed', {
            detail: { previousDate: lastKnown, newDate: currentSystemToday },
          })
        );
      }
    };

    // 1. Periodic background interval every 15 seconds
    const intervalId = setInterval(checkDateRollover, 15000);

    // 2. Immediate check when browser tab becomes active or window gains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDateRollover();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkDateRollover);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkDateRollover);
    };
  }, [timeframe]);

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
        systemToday,
        dateTick,
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

