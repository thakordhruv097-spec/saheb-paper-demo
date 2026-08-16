import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
}

interface CustomSearchableSelectProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
  className?: string;
}

export const CustomSearchableSelect: React.FC<CustomSearchableSelectProps> = ({
  label,
  placeholder = 'Select Option...',
  value,
  onChange,
  options,
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = useMemo(() => {
    return options.find(o => o.value === value);
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return options;
    return options.filter(
      o =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(q)) ||
        (o.badge && o.badge.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white flex items-center justify-between gap-2 text-left cursor-pointer focus:ring-2 focus:ring-blue-500 transition shadow-xs"
      >
        {selectedOption ? (
          <div className="flex items-center gap-2 truncate min-w-0">
            <span className="font-black text-slate-900 dark:text-white truncate">{selectedOption.label}</span>
            {selectedOption.badge && (
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shrink-0 ${
                selectedOption.badgeColor || 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20'
              }`}>
                {selectedOption.badge}
              </span>
            )}
            {selectedOption.sublabel && (
              <span className="text-[11px] font-mono text-slate-400 shrink-0 truncate">
                ({selectedOption.sublabel})
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 font-normal">{placeholder}</span>
        )}
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Searchable Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#091124] border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-2xl z-50 p-2.5 space-y-2 max-h-72 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Type to search..."
              className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-white focus:outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(o => {
                const isSelected = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-md'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold truncate">{o.label}</span>
                      {o.badge && (
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {o.badge}
                        </span>
                      )}
                    </div>
                    {o.sublabel && (
                      <span className={`text-[11px] font-mono shrink-0 font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {o.sublabel}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                No matching options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
