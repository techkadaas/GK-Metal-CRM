import React from 'react';
import { Calendar, RotateCcw, Clock, ArrowRight } from 'lucide-react';
import { DATE_PRESETS, getDateRangeForPreset, formatDateRangeLabel } from '../../utils/dateFilters';

export default function DateRangeFilter({
  preset = 'all',
  startDate = '',
  endDate = '',
  onChange,
  showRangeBadge = true,
  className = ''
}) {
  const handlePresetSelect = (newPreset) => {
    if (newPreset === 'custom') {
      onChange({
        preset: 'custom',
        startDate: startDate || '',
        endDate: endDate || ''
      });
      return;
    }

    const range = getDateRangeForPreset(newPreset);
    onChange({
      preset: newPreset,
      startDate: range.startDate,
      endDate: range.endDate
    });
  };

  const handleCustomDateChange = (field, value) => {
    const updated = {
      preset: 'custom',
      startDate: field === 'start' ? value : startDate,
      endDate: field === 'end' ? value : endDate
    };
    onChange(updated);
  };

  const handleReset = () => {
    onChange({
      preset: 'all',
      startDate: '',
      endDate: ''
    });
  };

  const isFiltered = preset !== 'all' || Boolean(startDate) || Boolean(endDate);

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {/* Preset Selector Dropdown */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs hover:border-slate-300 focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 transition">
        <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
          Period:
        </span>
        <select
          value={preset}
          onChange={(e) => handlePresetSelect(e.target.value)}
          className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
        >
          {DATE_PRESETS.map((p) => (
            <option key={p.value} value={p.value} className="font-medium">
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Range Inputs (Shown when 'custom' is active) */}
      {preset === 'custom' && (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>
      )}

      {/* Active Range Badge */}
      {showRangeBadge && isFiltered && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-50 border border-sky-200/70 text-sky-700 rounded-lg text-xs font-mono font-semibold">
          <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>{formatDateRangeLabel(startDate, endDate)}</span>
        </div>
      )}

      {/* Clear / Reset Button */}
      {isFiltered && (
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition active:scale-95 cursor-pointer"
          title="Reset filter to All Time"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
}
