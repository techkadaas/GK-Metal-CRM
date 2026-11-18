import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';

/**
 * Normalizes any date representation (YYYY-MM-DD or DD-MM-YYYY or Date) to DD-MM-YYYY string
 */
export function normalizeDateToDDMMYYYY(val) {
  if (!val) return '';
  const s = String(val).trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${d}-${m}-${y}`;
  }
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return s;
  }
}

/**
 * Parses DD-MM-YYYY or YYYY-MM-DD string into a valid Date object
 */
export function parseToDateObj(str) {
  if (!str) return null;
  const s = String(str).trim();
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(s);
  return isNaN(date.getTime()) ? null : date;
}

export default function MultiDatePicker({
  selectedDates = [],
  onChange,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize selected dates into array of DD-MM-YYYY
  const normalizedDates = Array.isArray(selectedDates)
    ? selectedDates.map(normalizeDateToDDMMYYYY).filter(Boolean)
    : (typeof selectedDates === 'string'
        ? selectedDates.split(',').map(s => normalizeDateToDDMMYYYY(s.trim())).filter(Boolean)
        : []);

  // Determine initial calendar month view
  const getInitialViewDate = () => {
    if (normalizedDates.length > 0) {
      const last = parseToDateObj(normalizedDates[normalizedDates.length - 1]);
      if (last) return new Date(last.getFullYear(), last.getMonth(), 1);
    }
    return new Date();
  };

  const [viewDate, setViewDate] = useState(getInitialViewDate);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToggleDate = (dateStr) => {
    const formatted = normalizeDateToDDMMYYYY(dateStr);
    let updated;
    if (normalizedDates.includes(formatted)) {
      updated = normalizedDates.filter(d => d !== formatted);
    } else {
      updated = [...normalizedDates, formatted];
    }
    if (onChange) onChange(updated);
  };

  const handleRemoveDate = (dateStr, e) => {
    if (e) e.stopPropagation();
    const updated = normalizedDates.filter(d => d !== dateStr);
    if (onChange) onChange(updated);
  };

  const handleClearAll = (e) => {
    if (e) e.stopPropagation();
    if (onChange) onChange([]);
  };

  // Calendar calculations
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const monthName = viewDate.toLocaleString('default', { month: 'short' });

  // Label text for trigger button
  const getButtonLabel = () => {
    if (normalizedDates.length === 0) {
      return 'dd-mm-yyyy';
    }
    if (normalizedDates.length === 1) {
      return normalizedDates[0];
    }
    return `${normalizedDates.length} dates selected`;
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button (matches input styling) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Click to select one or multiple test dates"
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition cursor-pointer select-none ${
          normalizedDates.length > 0
            ? 'bg-sky-50/70 border-sky-300 text-sky-950 font-semibold'
            : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
        }`}
      >
        <Calendar className={`w-3.5 h-3.5 ${normalizedDates.length > 0 ? 'text-sky-600' : 'text-slate-400'}`} />
        <span className="font-mono text-[11.5px]">{getButtonLabel()}</span>
        {normalizedDates.length > 1 && (
          <span className="px-1.5 py-0.2 bg-sky-600 text-white rounded-full font-bold text-[10px] leading-tight">
            {normalizedDates.length}
          </span>
        )}
      </button>

      {/* Multi-Date Calendar Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3.5 text-xs animate-scale-in">
          {/* Popover Header: Month / Year Navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-xs text-slate-800">
              {monthName} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 my-1.5">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-7" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${String(dayNum).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`;
              const isSelected = normalizedDates.includes(dateStr);

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleToggleDate(dateStr)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold transition flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white font-bold shadow-xs scale-105'
                      : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick Date Add Picker (fallback & direct input) */}
          <div className="pt-2.5 mt-2.5 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="date"
                title="Pick another date to add"
                onChange={(e) => {
                  if (e.target.value) {
                    const norm = normalizeDateToDDMMYYYY(e.target.value);
                    if (norm && !normalizedDates.includes(norm)) {
                      handleToggleDate(norm);
                    }
                    e.target.value = '';
                  }
                }}
                className="flex-1 px-2 py-1 text-[11px] font-medium border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
              />
              {normalizedDates.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Selected Dates Chips Inside Popover */}
            {normalizedDates.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Selected ({normalizedDates.length}):
                </span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {normalizedDates.map((dStr, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 text-sky-800 rounded-md font-mono text-[10.5px] font-semibold"
                    >
                      {dStr}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveDate(dStr, e)}
                        className="text-sky-500 hover:text-rose-600 transition"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Popover Footer */}
          <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Click any day to toggle</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
