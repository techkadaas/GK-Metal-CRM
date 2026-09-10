import React from 'react';
import { getStatusColor } from '../../utils/formatters';

export default function InvoiceStatusBadge({ status }) {
  const style = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
      <span>{status || 'Draft'}</span>
    </span>
  );
}
