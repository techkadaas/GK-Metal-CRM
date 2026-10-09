import { formatDate } from './formatters';

/**
 * Normalizes any date value (ISO string, Date object, timestamp) to YYYY-MM-DD
 * in local time, safely handling timezone boundaries and avoiding midnight cutoffs.
 */
export function toDateStr(val) {
  if (!val) return '';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    return val.substring(0, 10);
  }
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch (e) {
    return '';
  }
}

/**
 * Filter preset definitions
 */
export const DATE_PRESETS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'Last 3 Months', value: 'last_3_months' },
  { label: 'Last 6 Months', value: 'last_6_months' },
  { label: 'Custom Range', value: 'custom' }
];

/**
 * Returns { startDate, endDate, label } for a given preset
 */
export function getDateRangeForPreset(preset, customStart = '', customEnd = '') {
  const now = new Date();
  const todayStr = toDateStr(now);

  switch (preset) {
    case 'today':
      return { startDate: todayStr, endDate: todayStr, label: 'Today' };

    case 'yesterday': {
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const yStr = toDateStr(y);
      return { startDate: yStr, endDate: yStr, label: 'Yesterday' };
    }

    case 'this_week': {
      // Monday to Sunday of the current week
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
      return { startDate: toDateStr(monday), endDate: toDateStr(sunday), label: 'This Week' };
    }

    case 'this_month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: toDateStr(firstDay), endDate: toDateStr(lastDay), label: 'This Month' };
    }

    case 'last_month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: toDateStr(firstDay), endDate: toDateStr(lastDay), label: 'Last Month' };
    }

    case 'last_3_months': {
      // From start of month 3 months ago up to today
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return { startDate: toDateStr(start), endDate: todayStr, label: 'Last 3 Months' };
    }

    case 'last_6_months': {
      // From start of month 6 months ago up to today
      const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      return { startDate: toDateStr(start), endDate: todayStr, label: 'Last 6 Months' };
    }

    case 'custom':
      return {
        startDate: customStart || '',
        endDate: customEnd || '',
        label: 'Custom Range'
      };

    case 'all':
    default:
      return { startDate: '', endDate: '', label: 'All Time' };
  }
}

/**
 * Formats date range into a user-friendly badge string
 */
export function formatDateRangeLabel(startDate, endDate) {
  if (!startDate && !endDate) return 'All Time';
  if (startDate === endDate && startDate) {
    return formatDate(startDate);
  }
  if (startDate && endDate) {
    return `${formatDate(startDate)} → ${formatDate(endDate)}`;
  }
  if (startDate) {
    return `From ${formatDate(startDate)}`;
  }
  if (endDate) {
    return `Up to ${formatDate(endDate)}`;
  }
  return 'All Time';
}

/**
 * Checks whether a given invoice/record date falls within the selected startDate and endDate.
 */
export function isDateInRange(dateValue, startDate, endDate) {
  if (!startDate && !endDate) return true;
  const dStr = toDateStr(dateValue);
  if (!dStr) return false;
  if (startDate && dStr < startDate) return false;
  if (endDate && dStr > endDate) return false;
  return true;
}
