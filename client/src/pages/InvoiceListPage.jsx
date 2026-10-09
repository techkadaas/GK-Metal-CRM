import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useSearchParams, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Printer,
  Eye,
  Edit,
  Copy,
  Trash2,
  Calendar,
  XCircle,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate, formatInvoiceNumber } from '../utils/formatters';
import InvoiceStatusBadge from '../components/invoice/InvoiceStatusBadge';
import { useToast } from '../context/ToastContext';
import DateRangeFilter from '../components/common/DateRangeFilter';
import { isDateInRange, formatDateRangeLabel } from '../utils/dateFilters';

export default function InvoiceListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const statusFilter = searchParams.get('status') || 'All';
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [preset, setPreset] = useState(searchParams.get('period') || (searchParams.get('startDate') ? 'custom' : 'all'));

  const statusTabs = [
    { label: 'All', value: 'All' }
  ];

  const fetchInvoices = async (queryOverride, filterOverride) => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter && statusFilter !== 'All') {
        params.status = statusFilter;
      }
      const activeSearch = queryOverride !== undefined ? queryOverride : searchQuery;
      if (activeSearch) params.search = activeSearch;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const activeStart = filterOverride?.startDate !== undefined ? filterOverride.startDate : startDate;
      const activeEnd = filterOverride?.endDate !== undefined ? filterOverride.endDate : endDate;
      if (activeStart) params.startDate = activeStart;
      if (activeEnd) params.endDate = activeEnd;

      const res = await api.getInvoices(params);
      if (res.success && res.data) {
        setInvoices(res.data);
      }
    } catch (e) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, sortBy, sortOrder, startDate, endDate]);

  const handleDateFilterChange = (filter) => {
    setPreset(filter.preset);
    setStartDate(filter.startDate);
    setEndDate(filter.endDate);

    const newParams = new URLSearchParams(searchParams);
    if (filter.preset && filter.preset !== 'all') {
      newParams.set('period', filter.preset);
    } else {
      newParams.delete('period');
    }

    if (filter.startDate) {
      newParams.set('startDate', filter.startDate);
    } else {
      newParams.delete('startDate');
    }

    if (filter.endDate) {
      newParams.set('endDate', filter.endDate);
    } else {
      newParams.delete('endDate');
    }

    setSearchParams(newParams, { replace: true });
    fetchInvoices(undefined, filter);
  };

  // Real-time filtered invoices based on company name, invoice number, etc.
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Status filter
      if (statusFilter && statusFilter !== 'All') {
        if (inv.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // Search query filter (matches company name, invoice number, GSTIN, test report, contact, etc.)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const invNo = String(inv.invoiceNumber || '').toLowerCase();
        const formattedInvNo = formatInvoiceNumber(inv.invoiceNumber).toLowerCase();
        const seq = String(inv.sequenceNumber || '');
        const buyerCompany = String(inv.buyerSnapshot?.companyName || inv.customer?.companyName || '').toLowerCase();
        const buyerGstin = String(inv.buyerSnapshot?.gstin || '').toLowerCase();
        const buyerContact = String(inv.buyerSnapshot?.contactPerson || '').toLowerCase();
        const buyerPhone = String(inv.buyerSnapshot?.phone || '').toLowerCase();
        const testReport = String(inv.metadata?.testReportRef || '').toLowerCase();
        const buyerOrder = String(inv.metadata?.buyerOrderNo || '').toLowerCase();
        const itemsDesc = Array.isArray(inv.items)
          ? inv.items.map(it => it.description || '').join(' ').toLowerCase()
          : '';

        const matches =
          invNo.includes(q) ||
          formattedInvNo.includes(q) ||
          seq.includes(q) ||
          buyerCompany.includes(q) ||
          buyerGstin.includes(q) ||
          buyerContact.includes(q) ||
          buyerPhone.includes(q) ||
          testReport.includes(q) ||
          buyerOrder.includes(q) ||
          itemsDesc.includes(q);

        if (!matches) return false;
      }

      // Date range filter
      if (startDate || endDate) {
        if (!isDateInRange(inv.invoiceDate || inv.createdAt, startDate, endDate)) {
          return false;
        }
      }

      return true;
    });
  }, [invoices, statusFilter, searchQuery, startDate, endDate]);

  // Sorted invoices
  const sortedInvoices = useMemo(() => {
    const list = [...filteredInvoices];
    list.sort((a, b) => {
      if (sortBy === 'amount') {
        const diff = (a.grandTotal || 0) - (b.grandTotal || 0);
        return sortOrder === 'asc' ? diff : -diff;
      }
      if (sortBy === 'invoiceNumber') {
        const cmp = String(a.invoiceNumber || '').localeCompare(String(b.invoiceNumber || ''));
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      // date: newest first
      const timeA = new Date(a.createdAt || a.invoiceDate || 0).getTime();
      const timeB = new Date(b.createdAt || b.invoiceDate || 0).getTime();
      if (timeA !== timeB) {
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      return sortOrder === 'asc'
        ? (a.sequenceNumber || 0) - (b.sequenceNumber || 0)
        : (b.sequenceNumber || 0) - (a.sequenceNumber || 0);
    });
    return list;
  }, [filteredInvoices, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleTabChange = (val) => {
    if (val === 'All') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', val);
    }
    setSearchParams(searchParams);
  };

  const handleDuplicate = async (id, invNum) => {
    try {
      const res = await api.duplicateInvoice(id);
      if (res.success && res.data) {
        toast.success(`Duplicated ${invNum} as new draft ${res.data.invoiceNumber}`);
        navigate(`/invoices/${res.data._id}`);
      }
    } catch (e) {
      toast.error('Failed to duplicate invoice');
    }
  };

  const handleCancelInvoice = async (id, invNum) => {
    if (window.confirm(`Are you sure you want to mark ${invNum} as Cancelled?`)) {
      try {
        const res = await api.deleteInvoice(id, false);
        if (res.success) {
          toast.success(`Invoice ${invNum} marked as Cancelled`);
          fetchInvoices();
        }
      } catch (e) {
        toast.error('Failed to cancel invoice');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, manage and track all GST tax invoices
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchInvoices}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs transition"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>

          <NavLink
            to="/invoices/create"
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-sm transition active:scale-[0.98] border border-sky-400/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Invoice</span>
          </NavLink>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Status Tabs */}
        <div className="border-b border-slate-200 px-4 bg-slate-50/70 flex items-center gap-1 overflow-x-auto">
          {statusTabs.map((tab) => {
            const isActive = (tab.value === 'All' && !searchParams.get('status')) || searchParams.get('status') === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                className={`px-3.5 py-3 text-xs font-semibold whitespace-nowrap transition border-b-2 ${
                  isActive
                    ? 'border-sky-600 text-sky-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Toolbar & Filter Matrix */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search company name, invoice number, GSTIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Sorting & Counter */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 shrink-0">Sort:</span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [f, o] = e.target.value.split('-');
                    setSortBy(f);
                    setSortOrder(o);
                  }}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white cursor-pointer"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Highest Amount</option>
                  <option value="amount-asc">Lowest Amount</option>
                  <option value="invoiceNumber-asc">Invoice No (Asc)</option>
                </select>
              </div>

              <span className="text-xs font-mono text-slate-500 pl-2 border-l border-slate-200">
                Found <strong>{sortedInvoices.length}</strong> {sortedInvoices.length === 1 ? 'invoice' : 'invoices'}
              </span>
            </div>
          </div>

          {/* Date Range Filter Row */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <DateRangeFilter
              preset={preset}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateFilterChange}
            />

            <div className="flex items-center gap-2 text-xs text-slate-500 self-start sm:self-auto">
              <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Scope:</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 font-mono font-bold text-slate-700 text-xs">
                {formatDateRangeLabel(startDate, endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Invoices Data Table (No horizontal scroll, clean proportional layout) */}
        <div className="w-full overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-[16%]">Invoice No.</th>
                <th className="py-3 px-3 w-[26%]">Buyer / Customer</th>
                <th className="py-3 px-3 w-[12%]">Date</th>
                <th className="py-3 px-3 text-right w-[11%]">Taxable (₹)</th>
                <th className="py-3 px-3 text-right w-[10%]">GST (₹)</th>
                <th className="py-3 px-3 text-right w-[12%]">Grand Total (₹)</th>
                <th className="py-3 px-3 text-center w-[10%]">Payment</th>
                <th className="py-3 px-4 text-center w-[8%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedInvoices.length > 0 ? (
                sortedInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/80 transition group">
                    {/* Invoice No */}
                    <td className="py-3 px-4">
                      <NavLink
                        to={`/invoices/${inv._id}`}
                        className="font-mono font-bold text-sky-700 hover:text-sky-800 hover:underline block truncate"
                      >
                        {formatInvoiceNumber(inv.invoiceNumber)}
                      </NavLink>
                      {inv.metadata?.testReportRef && (
                        <span className="text-[10px] text-slate-400 font-mono block truncate">
                          TR: {inv.metadata.testReportRef}
                        </span>
                      )}
                    </td>

                    {/* Buyer */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 truncate">
                        {inv.buyerSnapshot?.companyName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        GST: {inv.buyerSnapshot?.gstin || '—'}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap font-mono">
                      {formatDate(inv.invoiceDate)}
                    </td>

                    {/* Taxable Subtotal */}
                    <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                      {formatINR(inv.taxableTotal || inv.subtotal)}
                    </td>

                    {/* Total GST */}
                    <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                      {formatINR(inv.totalTax || (inv.cgstAmount + inv.sgstAmount + inv.igstAmount))}
                    </td>

                    {/* Grand Total */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatINR(inv.grandTotal)}
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        inv.paymentStatus === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : inv.paymentStatus === 'Partially Paid'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                      }`}>
                        {inv.paymentStatus || 'Unpaid'}
                      </span>
                    </td>

                    {/* Row Actions (View & Edit Only) */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <NavLink
                          to={`/invoices/${inv._id}`}
                          title="View Details"
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md transition"
                        >
                          <Eye className="w-4 h-4" />
                        </NavLink>

                        <NavLink
                          to={`/invoices/${inv._id}/edit`}
                          title="Edit Invoice"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
                        >
                          <Edit className="w-4 h-4" />
                        </NavLink>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    {searchQuery.trim() ? (
                      <div className="space-y-2">
                        <p className="text-slate-600 font-medium">
                          No invoices matching &ldquo;<span className="text-slate-900 font-bold">{searchQuery}</span>&rdquo;
                        </p>
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="text-xs text-sky-600 hover:text-sky-700 font-semibold underline cursor-pointer"
                        >
                          Clear search query
                        </button>
                      </div>
                    ) : (preset !== 'all' || startDate || endDate) ? (
                      <div className="space-y-2">
                        <p className="text-slate-600 font-medium">
                          No invoices found for the period <span className="font-bold text-slate-800">{formatDateRangeLabel(startDate, endDate)}</span>.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleDateFilterChange({ preset: 'all', startDate: '', endDate: '' })}
                          className="text-xs text-sky-600 hover:text-sky-700 font-semibold underline cursor-pointer"
                        >
                          Reset period filter
                        </button>
                      </div>
                    ) : (
                      'No invoices matching the selected filters.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

