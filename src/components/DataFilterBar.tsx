import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, Calendar, ChevronDown } from 'lucide-react';

export interface FilterDropdownOption {
  label: string;
  value: string;
}

export interface FilterField {
  id: string;
  label: string;
  options: FilterDropdownOption[];
}

interface DataFilterBarProps {
  /** Date range filter */
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  /** Optional dropdown filters */
  filterFields?: FilterField[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (fieldId: string, value: string) => void;
  /** Clear all callback */
  onClearAll: () => void;
  /** Active filter count (auto-calculated if not provided) */
  activeCount?: number;
}

export const DataFilterBar: React.FC<DataFilterBarProps> = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  filterFields = [],
  activeFilters = {},
  onFilterChange,
  onClearAll,
  activeCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Calculate active filter count
  const computedCount = activeCount ?? (() => {
    let count = 0;
    if (dateFrom) count++;
    if (dateTo) count++;
    Object.values(activeFilters).forEach(v => { if (v && v !== 'all') count++; });
    return count;
  })();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
          computedCount > 0
            ? 'bg-primary/10 dark:bg-blue-950/40 text-primary dark:text-blue-300 border-primary/30 dark:border-blue-700 shadow-sm shadow-primary/10'
            : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Filter className="h-3.5 w-3.5" />
        <span>Filter</span>
        {computedCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-primary text-white text-[9px] font-black min-w-[18px] text-center leading-none">
            {computedCount}
          </span>
        )}
      </button>

      {/* Filter Popup Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[340px] md:w-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-primary" />
              Filter Records
            </h4>
            <div className="flex items-center gap-2">
              {computedCount > 0 && (
                <button
                  onClick={() => { onClearAll(); }}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 uppercase tracking-wider cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => onDateFromChange(e.target.value)}
                  className="w-full py-2 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => onDateToChange(e.target.value)}
                  className="w-full py-2 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Filter Fields (Modern Chip Buttons) */}
          {filterFields.map(field => {
            const curVal = activeFilters[field.id] || 'all';
            return (
              <div key={field.id} className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {field.label}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onFilterChange?.(field.id, 'all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      curVal === 'all'
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    All
                  </button>
                  {field.options.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onFilterChange?.(field.id, opt.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        curVal === opt.value
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Active Filters Summary */}
          {computedCount > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-primary dark:text-blue-400">
                ✓ {computedCount} filter{computedCount > 1 ? 's' : ''} active — results updated live
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
