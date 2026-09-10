import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit2,
  Trash2,
  X,
  IndianRupee,
  CheckCircle2,
  Calendar,
  Eye,
  ArrowUpDown,
  Filter,
  Download,
  MoreVertical,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  CreditCard,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import { INDIAN_STATES } from '../utils/taxCalculator';
import { useToast } from '../context/ToastContext';

// Helper to generate consistent avatar background based on company name
function getAvatarColor(name = '') {
  const colors = [
    { bg: 'bg-slate-800 text-white border-slate-700' },
    { bg: 'bg-indigo-900 text-indigo-100 border-indigo-800' },
    { bg: 'bg-blue-900 text-blue-100 border-blue-800' },
    { bg: 'bg-teal-900 text-teal-100 border-teal-800' },
    { bg: 'bg-slate-700 text-slate-100 border-slate-600' },
    { bg: 'bg-cyan-900 text-cyan-100 border-cyan-800' }
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name = '') {
  if (!name) return 'CM';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // Core Data States
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, Active, Inactive
  const [balanceFilter, setBalanceFilter] = useState('ALL'); // ALL, DUE, SETTLED
  const [stateFilter, setStateFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NAME_ASC'); // NAME_ASC, NAME_DESC, OUTSTANDING_DESC, BILLED_DESC, RECENT_INVOICE, CREATED_DESC
  const [viewMode, setViewMode] = useState('table'); // table, grid

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Drawer / View / Action States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailTab, setDetailTab] = useState('overview'); // overview, invoices
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [copiedGstin, setCopiedGstin] = useState(null);

  // Modal (Add / Edit) States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);

  // Delete Confirmation Modal State
  const [deleteConfirmCust, setDeleteConfirmCust] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Customer Form Data
  const initialFormState = {
    customerId: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    pan: '',
    paymentTerms: '30 Days Net',
    status: 'Active',
    billingAddress: {
      street: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      stateCode: '33',
      pincode: ''
    },
    shippingAddress: {
      street: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      stateCode: '33',
      pincode: ''
    }
  };
  const [formData, setFormData] = useState(initialFormState);

  // Search Input ref for keyboard shortcut
  const searchInputRef = useRef(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !showModal && !selectedCustomer) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (activeMenuId) setActiveMenuId(null);
        if (showModal) setShowModal(false);
        if (selectedCustomer) setSelectedCustomer(null);
        if (deleteConfirmCust) setDeleteConfirmCust(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, selectedCustomer, activeMenuId, deleteConfirmCust]);

  // Click outside to close dropdown action menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.row-actions-menu')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch all customers
  const fetchCustomers = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);

      const res = await api.getCustomers();
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch (e) {
      toast.error('Failed to load customer profiles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Extract unique states from customer list for state filter
  const availableStates = useMemo(() => {
    const states = new Set();
    customers.forEach(c => {
      if (c.billingAddress?.state) states.add(c.billingAddress.state);
    });
    return Array.from(states).sort();
  }, [customers]);

  // Comprehensive Filter & Sorting Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = cust.companyName?.toLowerCase().includes(q);
        const matchesId = cust.customerId?.toLowerCase().includes(q);
        const matchesGstin = cust.gstin?.toLowerCase().includes(q);
        const matchesContact = cust.contactPerson?.toLowerCase().includes(q);
        const matchesPhone = cust.phone?.toLowerCase().includes(q);
        const matchesEmail = cust.email?.toLowerCase().includes(q);
        const matchesCity = cust.billingAddress?.city?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesGstin && !matchesContact && !matchesPhone && !matchesEmail && !matchesCity) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== 'ALL') {
        if ((cust.status || 'Active') !== statusFilter) return false;
      }

      // Financial / Balance Filter
      if (balanceFilter === 'DUE') {
        if ((cust.stats?.outstandingBalance || 0) <= 0) return false;
      } else if (balanceFilter === 'SETTLED') {
        if ((cust.stats?.outstandingBalance || 0) > 0) return false;
      }

      // State Filter
      if (stateFilter !== 'ALL') {
        if (cust.billingAddress?.state !== stateFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'NAME_ASC':
          return (a.companyName || '').localeCompare(b.companyName || '');
        case 'NAME_DESC':
          return (b.companyName || '').localeCompare(a.companyName || '');
        case 'OUTSTANDING_DESC':
          return (b.stats?.outstandingBalance || 0) - (a.stats?.outstandingBalance || 0);
        case 'BILLED_DESC':
          return (b.stats?.totalBilled || 0) - (a.stats?.totalBilled || 0);
        case 'RECENT_INVOICE':
          const dateA = a.stats?.lastInvoiceDate ? new Date(a.stats.lastInvoiceDate).getTime() : 0;
          const dateB = b.stats?.lastInvoiceDate ? new Date(b.stats.lastInvoiceDate).getTime() : 0;
          return dateB - dateA;
        case 'CREATED_DESC':
          return (b.customerId || '').localeCompare(a.customerId || '');
        default:
          return 0;
      }
    });
  }, [customers, searchQuery, statusFilter, balanceFilter, stateFilter, sortBy]);

  // Aggregated Summary Metrics across all loaded customers
  const metrics = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => (c.status || 'Active') === 'Active').length;
    const totalBilled = customers.reduce((sum, c) => sum + (c.stats?.totalBilled || 0), 0);
    const totalOutstanding = customers.reduce((sum, c) => sum + (c.stats?.outstandingBalance || 0), 0);
    const customersWithDues = customers.filter(c => (c.stats?.outstandingBalance || 0) > 0).length;

    return {
      total,
      active,
      totalBilled,
      totalOutstanding,
      customersWithDues
    };
  }, [customers]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, balanceFilter, stateFilter, sortBy, pageSize]);

  // Copy GSTIN helper
  const handleCopyGstin = (e, gstin) => {
    e.stopPropagation();
    if (!gstin) return;
    navigator.clipboard.writeText(gstin);
    setCopiedGstin(gstin);
    toast.success(`Copied GSTIN ${gstin}`);
    setTimeout(() => setCopiedGstin(null), 2000);
  };

  // Open Create Customer Modal
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setSameAsBilling(true);
    setFormData({
      ...initialFormState,
      customerId: `CUST-${String(customers.length + 1001).padStart(4, '0')}`
    });
    setShowModal(true);
  };

  // Open Edit Customer Modal
  const handleOpenEditModal = (cust, e) => {
    if (e) e.stopPropagation();
    setIsEditing(true);
    setActiveMenuId(null);
    setFormData({
      _id: cust._id,
      customerId: cust.customerId || '',
      companyName: cust.companyName || '',
      contactPerson: cust.contactPerson || '',
      email: cust.email || '',
      phone: cust.phone || '',
      gstin: cust.gstin || '',
      pan: cust.pan || '',
      paymentTerms: cust.paymentTerms || '30 Days Net',
      status: cust.status || 'Active',
      billingAddress: {
        street: cust.billingAddress?.street || '',
        city: cust.billingAddress?.city || 'Chennai',
        state: cust.billingAddress?.state || 'Tamil Nadu',
        stateCode: cust.billingAddress?.stateCode || '33',
        pincode: cust.billingAddress?.pincode || ''
      },
      shippingAddress: {
        street: cust.shippingAddress?.street || cust.billingAddress?.street || '',
        city: cust.shippingAddress?.city || cust.billingAddress?.city || 'Chennai',
        state: cust.shippingAddress?.state || cust.billingAddress?.state || 'Tamil Nadu',
        stateCode: cust.shippingAddress?.stateCode || cust.billingAddress?.stateCode || '33',
        pincode: cust.shippingAddress?.pincode || cust.billingAddress?.pincode || ''
      }
    });
    setShowModal(true);
  };

  // View Customer Full Profile / Ledger Drawer
  const handleViewCustomerDetail = async (id, e) => {
    if (e) e.stopPropagation();
    setActiveMenuId(null);
    try {
      const res = await api.getCustomerById(id);
      if (res.success && res.data) {
        setSelectedCustomer(res.data);
        setDetailTab('overview');
      }
    } catch (err) {
      toast.error('Failed to load customer profile details');
    }
  };

  // Create Invoice Quick Action (Business UX Requirement)
  const handleCreateInvoiceForCustomer = (cust, e) => {
    if (e) e.stopPropagation();
    navigate(`/invoices/create?customerId=${cust._id || cust.customerId}`);
  };

  // Auto-parse GSTIN to extract State Code & PAN
  const handleGstinChange = (e) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    const code = raw.substring(0, 2);
    const matchedState = INDIAN_STATES.find(s => s.code === code);
    const extractedPan = raw.length >= 12 ? raw.substring(2, 12) : formData.pan;

    setFormData(prev => ({
      ...prev,
      gstin: raw,
      pan: extractedPan,
      billingAddress: {
        ...prev.billingAddress,
        stateCode: code || prev.billingAddress.stateCode,
        state: matchedState ? matchedState.name : prev.billingAddress.state
      },
      shippingAddress: {
        ...prev.shippingAddress,
        stateCode: code || prev.shippingAddress.stateCode,
        state: matchedState ? matchedState.name : prev.shippingAddress.state
      }
    }));
  };

  // State dropdown change
  const handleStateChange = (code) => {
    const matched = INDIAN_STATES.find(s => s.code === code);
    const stateName = matched ? matched.name : 'Tamil Nadu';
    setFormData(prev => ({
      ...prev,
      billingAddress: { ...prev.billingAddress, stateCode: code, state: stateName },
      shippingAddress: sameAsBilling
        ? { ...prev.shippingAddress, stateCode: code, state: stateName }
        : prev.shippingAddress
    }));
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast.error('Company / Buyer Name is required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        shippingAddress: sameAsBilling ? { ...formData.billingAddress } : formData.shippingAddress
      };

      if (isEditing) {
        const res = await api.updateCustomer(formData._id, payload);
        if (res.success) {
          toast.success(`Updated customer "${formData.companyName}"`);
          setShowModal(false);
          fetchCustomers(true);
          if (selectedCustomer && selectedCustomer._id === formData._id) {
            handleViewCustomerDetail(formData._id);
          }
        }
      } else {
        const res = await api.createCustomer(payload);
        if (res.success) {
          toast.success(`Created customer "${formData.companyName}"`);
          setShowModal(false);
          fetchCustomers(true);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  // Safe Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmCust) return;
    try {
      setDeleting(true);
      const res = await api.deleteCustomer(deleteConfirmCust._id);
      if (res.success) {
        toast.success(`Deleted customer "${deleteConfirmCust.companyName}"`);
        setDeleteConfirmCust(null);
        if (selectedCustomer?._id === deleteConfirmCust._id) {
          setSelectedCustomer(null);
        }
        fetchCustomers(true);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  // Export to CSV Function
  const handleExportCSV = () => {
    if (!filteredCustomers.length) {
      toast.error('No customer records to export');
      return;
    }

    const headers = [
      'Customer ID',
      'Company Name',
      'Contact Person',
      'Phone',
      'Email',
      'GSTIN',
      'PAN',
      'City',
      'State',
      'State Code',
      'Pincode',
      'Payment Terms',
      'Status',
      'Total Invoices',
      'Total Billed (INR)',
      'Total Paid (INR)',
      'Outstanding Balance (INR)',
      'Last Invoice Date'
    ];

    const rows = filteredCustomers.map(c => [
      `"${c.customerId || ''}"`,
      `"${(c.companyName || '').replace(/"/g, '""')}"`,
      `"${(c.contactPerson || '').replace(/"/g, '""')}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      `"${c.gstin || ''}"`,
      `"${c.pan || ''}"`,
      `"${c.billingAddress?.city || ''}"`,
      `"${c.billingAddress?.state || ''}"`,
      `"${c.billingAddress?.stateCode || ''}"`,
      `"${c.billingAddress?.pincode || ''}"`,
      `"${c.paymentTerms || ''}"`,
      `"${c.status || 'Active'}"`,
      c.stats?.totalInvoices || 0,
      c.stats?.totalBilled || 0,
      c.stats?.totalPaid || 0,
      c.stats?.outstandingBalance || 0,
      c.stats?.lastInvoiceDate ? formatDate(c.stats.lastInvoiceDate) : 'Never'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GK_Metal_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredCustomers.length} customer records to CSV`);
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || balanceFilter !== 'ALL' || stateFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setBalanceFilter('ALL');
    setStateFilter('ALL');
    setSortBy('NAME_ASC');
  };

  return (
    <div className="space-y-5 animate-fade-in text-slate-800">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customers</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {customers.length} Profiles
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage customer profiles, GST information and invoice relationships
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchCustomers(true)}
            disabled={refreshing || loading}
            title="Refresh customer data"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            title="Export filtered records to CSV"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-xs transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition active:scale-95 focus:ring-2 focus:ring-slate-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* 2. Customer Summary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Accounts */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Accounts</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold text-slate-900">{metrics.total}</span>
              <span className="text-[11px] text-slate-500 font-medium">Registered</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 2: Active Profiles */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Active Profiles</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-bold text-slate-900">{metrics.active}</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                {metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0}% Active
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 3: Total Billed */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Total Billed</span>
            <div className="mt-0.5">
              <span className="text-base font-bold text-slate-900 font-mono">
                {formatINR(metrics.totalBilled)}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 4: Outstanding Amount */}
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Outstanding Due</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-base font-bold font-mono ${metrics.totalOutstanding > 0 ? 'text-amber-800' : 'text-slate-900'}`}>
                {formatINR(metrics.totalOutstanding)}
              </span>
            </div>
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${metrics.totalOutstanding > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Search and Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by company, GSTIN, phone or customer ID... (Press '/' to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>

            {/* Outstanding Balance Filter */}
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
            >
              <option value="ALL">All Balances</option>
              <option value="DUE">With Dues (Pending)</option>
              <option value="SETTLED">Settled (₹0)</option>
            </select>

            {/* State Filter */}
            {availableStates.length > 0 && (
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition max-w-[140px] truncate"
              >
                <option value="ALL">All States</option>
                {availableStates.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            )}

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
            >
              <option value="NAME_ASC">Name (A → Z)</option>
              <option value="NAME_DESC">Name (Z → A)</option>
              <option value="OUTSTANDING_DESC">Highest Due</option>
              <option value="BILLED_DESC">Highest Billed</option>
              <option value="RECENT_INVOICE">Recent Invoice</option>
              <option value="CREATED_DESC">Customer ID</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-md transition ${viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Grid Cards View"
                className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Stats Bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-medium">
          <div>
            Showing <strong className="text-slate-800">{filteredCustomers.length}</strong> of{' '}
            <strong className="text-slate-800">{customers.length}</strong> customer accounts
            {hasActiveFilters && <span className="text-blue-600 ml-1.5">(Filtered)</span>}
          </div>

          <div className="flex items-center gap-3">
            <span>Page {currentPage} of {totalPages}</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-transparent border-0 text-[11px] font-semibold text-slate-700 focus:ring-0 p-0 cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Main Customer Content Area (Table or Grid) */}
      {loading ? (
        // Skeleton Loader
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="h-6 bg-slate-100 rounded w-1/4 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-slate-50 rounded-lg border border-slate-100 animate-pulse" />
            ))}
          </div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        // Professional Empty State
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3.5">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            {hasActiveFilters ? 'No matching customers found' : 'No customer profiles yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {hasActiveFilters
              ? 'Try adjusting your search query, state selection, or status filters.'
              : 'Register your first customer account to begin generating invoices and tracking financial ledgers.'}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          ) : (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Customer</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        // Enterprise Data Table View
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold tracking-tight uppercase text-[10px]">
                  <th className="py-3 px-4 min-w-[220px]">Customer</th>
                  <th className="py-3 px-3 min-w-[150px]">GSTIN / PAN</th>
                  <th className="py-3 px-3 min-w-[160px]">Contact Person</th>
                  <th className="py-3 px-3 min-w-[130px]">Location</th>
                  <th className="py-3 px-2 text-center min-w-[70px]">Invoices</th>
                  <th className="py-3 px-3 text-right min-w-[110px]">Outstanding</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">Last Invoice</th>
                  <th className="py-3 px-2 text-center min-w-[70px]">Status</th>
                  <th className="py-3 px-4 text-right min-w-[130px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCustomers.map((cust) => {
                  const avatarColor = getAvatarColor(cust.companyName);
                  const initials = getInitials(cust.companyName);
                  const isDue = (cust.stats?.outstandingBalance || 0) > 0;
                  const menuOpen = activeMenuId === cust._id;

                  return (
                    <tr
                      key={cust._id}
                      onClick={() => handleViewCustomerDetail(cust._id)}
                      className="group hover:bg-slate-50/90 transition cursor-pointer"
                    >
                      {/* Customer Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] border shrink-0 ${avatarColor.bg}`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-blue-700 transition truncate text-xs">
                              {cust.companyName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] font-semibold text-slate-500">
                                {cust.customerId || 'ID: —'}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] text-slate-500 truncate">
                                {cust.paymentTerms || '30 Days Net'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* GSTIN / PAN Column */}
                      <td className="py-3 px-3 font-mono">
                        {cust.gstin ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 text-[11px] tracking-tight">{cust.gstin}</span>
                            <button
                              onClick={(e) => handleCopyGstin(e, cust.gstin)}
                              title="Copy GSTIN"
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                            >
                              {copiedGstin === cust.gstin ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unregistered / —</span>
                        )}
                        {cust.pan && (
                          <div className="text-[10px] text-slate-400 font-medium">PAN: {cust.pan}</div>
                        )}
                      </td>

                      {/* Contact Person Column */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 truncate text-[11px]">
                          {cust.contactPerson || '—'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate font-mono mt-0.5">
                          {cust.phone || cust.email || 'No direct phone'}
                        </div>
                      </td>

                      {/* Location Column */}
                      <td className="py-3 px-3">
                        <div className="text-slate-700 font-medium truncate text-[11px]">
                          {cust.billingAddress?.city || 'Chennai'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {cust.billingAddress?.state || 'Tamil Nadu'} ({cust.billingAddress?.stateCode || '33'})
                        </div>
                      </td>

                      {/* Invoices Count Column */}
                      <td className="py-3 px-2 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 font-mono">
                          {cust.stats?.totalInvoices || 0}
                        </span>
                      </td>

                      {/* Outstanding Due Column */}
                      <td className="py-3 px-3 text-right font-mono">
                        {isDue ? (
                          <div className="inline-block text-right">
                            <span className="font-bold text-amber-800 text-xs">
                              {formatINR(cust.stats.outstandingBalance)}
                            </span>
                            <span className="block text-[9px] font-bold text-amber-600 uppercase tracking-tight">
                              Pending Due
                            </span>
                          </div>
                        ) : (
                          <div className="inline-block text-right">
                            <span className="font-semibold text-emerald-700 text-xs">₹0.00</span>
                            <span className="block text-[9px] font-semibold text-emerald-600 uppercase tracking-tight">
                              Settled
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Last Invoice Column */}
                      <td className="py-3 px-3 text-center whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {cust.stats?.lastInvoiceDate ? (
                          formatDate(cust.stats.lastInvoiceDate)
                        ) : (
                          <span className="text-slate-400 text-[10px]">No invoices</span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            (cust.status || 'Active') === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            (cust.status || 'Active') === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`} />
                          {cust.status || 'Active'}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1">
                          {/* Quick Create Invoice Action */}
                          <button
                            onClick={(e) => handleCreateInvoiceForCustomer(cust, e)}
                            title="Generate Invoice for this Customer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:text-white hover:bg-blue-600 bg-blue-50 border border-blue-200/80 rounded-md transition active:scale-95"
                          >
                            <FileText className="w-3 h-3" />
                            <span>+ Invoice</span>
                          </button>

                          {/* Quick View Profile Button */}
                          <button
                            onClick={(e) => handleViewCustomerDetail(cust._id, e)}
                            title="View Customer Profile & Ledger"
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-transparent hover:border-slate-200 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Customer Button */}
                          <button
                            onClick={(e) => handleOpenEditModal(cust, e)}
                            title="Edit Customer Profile"
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-transparent hover:border-slate-200 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* More Dropdown Menu */}
                          <div className="relative inline-block row-actions-menu">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(menuOpen ? null : cust._id);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {menuOpen && (
                              <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 text-left animate-fade-in text-xs">
                                <button
                                  onClick={(e) => handleViewCustomerDetail(cust._id, e)}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  <span>View Ledger History</span>
                                </button>
                                <button
                                  onClick={(e) => handleCreateInvoiceForCustomer(cust, e)}
                                  className="w-full px-3 py-1.5 text-left text-blue-700 hover:bg-blue-50 flex items-center gap-2 font-medium"
                                >
                                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Create New Invoice</span>
                                </button>
                                <button
                                  onClick={(e) => handleOpenEditModal(cust, e)}
                                  className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Edit Profile</span>
                                </button>
                                {cust.gstin && (
                                  <button
                                    onClick={(e) => handleCopyGstin(e, cust.gstin)}
                                    className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Copy GSTIN</span>
                                  </button>
                                )}
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    setDeleteConfirmCust(cust);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Delete Customer</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <div>
              Showing <span className="font-bold text-slate-800">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-bold text-slate-800">
                {Math.min(currentPage * pageSize, filteredCustomers.length)}
              </span> of <span className="font-bold text-slate-800">{filteredCustomers.length}</span> results
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 font-semibold text-slate-700">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Grid Card View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {paginatedCustomers.map((cust) => {
            const avatarColor = getAvatarColor(cust.companyName);
            const initials = getInitials(cust.companyName);
            const isDue = (cust.stats?.outstandingBalance || 0) > 0;

            return (
              <div
                key={cust._id}
                onClick={() => handleViewCustomerDetail(cust._id)}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 hover:shadow transition flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Top Row: Avatar + Title + Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs border shrink-0 ${avatarColor.bg}`}>
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-1">
                          {cust.companyName}
                        </h4>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {cust.customerId} • {cust.billingAddress?.city || 'Chennai'}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        (cust.status || 'Active') === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {cust.status || 'Active'}
                    </span>
                  </div>

                  {/* GSTIN & Contact Info */}
                  <div className="space-y-1.5 py-2.5 border-y border-slate-100 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">GSTIN:</span>
                      <span className="font-mono font-bold text-slate-800">{cust.gstin || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Contact:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[150px]">{cust.contactPerson || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-mono text-slate-800">{cust.phone || '—'}</span>
                    </div>
                  </div>

                  {/* Ledger Metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-1">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-medium uppercase block">Total Billed</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {formatINR(cust.stats?.totalBilled || 0)}
                      </span>
                    </div>
                    <div className={`p-2 rounded-lg border ${isDue ? 'bg-amber-50 border-amber-200/80' : 'bg-emerald-50 border-emerald-200/80'}`}>
                      <span className={`text-[10px] font-medium uppercase block ${isDue ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {isDue ? 'Outstanding Due' : 'Status'}
                      </span>
                      <span className={`text-xs font-bold font-mono ${isDue ? 'text-amber-800' : 'text-emerald-800'}`}>
                        {isDue ? formatINR(cust.stats.outstandingBalance) : 'Settled (₹0)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleCreateInvoiceForCustomer(cust, e)}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Invoice</span>
                  </button>
                  <button
                    onClick={(e) => handleOpenEditModal(cust, e)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Customer Profile & Ledger Details Drawer (Slide-Over / Modal) */}
      {selectedCustomer && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-xs max-h-[92vh] flex flex-col">
            {/* Drawer Header */}
            <div className="px-6 py-4.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-sky-400">
                  {getInitials(selectedCustomer.companyName)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white leading-tight">
                      {selectedCustomer.companyName}
                    </h2>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                      {selectedCustomer.customerId}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    GSTIN: {selectedCustomer.gstin || 'Not registered'} • Terms: {selectedCustomer.paymentTerms || '30 Days Net'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleCreateInvoiceForCustomer(selectedCustomer, e)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Invoice</span>
                </button>
                <button
                  onClick={(e) => handleOpenEditModal(selectedCustomer, e)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Edit Customer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Financial Ledger KPIs */}
            <div className="grid grid-cols-4 gap-2.5 p-4 bg-slate-50/80 border-b border-slate-200 shrink-0">
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Invoices</span>
                <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {selectedCustomer.stats?.totalInvoices || 0}
                </p>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Billed</span>
                <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                  {formatINR(selectedCustomer.stats?.totalBilled || 0)}
                </p>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Paid Amount</span>
                <p className="text-sm font-bold text-emerald-700 font-mono mt-0.5">
                  {formatINR(selectedCustomer.stats?.totalPaid || 0)}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg border ${(selectedCustomer.stats?.outstandingBalance || 0) > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                <span className={`text-[10px] uppercase font-semibold block ${(selectedCustomer.stats?.outstandingBalance || 0) > 0 ? 'text-amber-800' : 'text-slate-500'}`}>
                  Outstanding Due
                </span>
                <p className={`text-sm font-bold font-mono mt-0.5 ${(selectedCustomer.stats?.outstandingBalance || 0) > 0 ? 'text-amber-900' : 'text-slate-900'}`}>
                  {formatINR(selectedCustomer.stats?.outstandingBalance || 0)}
                </p>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex items-center gap-4 px-6 border-b border-slate-200 bg-white shrink-0">
              <button
                onClick={() => setDetailTab('overview')}
                className={`py-3 font-semibold text-xs border-b-2 transition ${detailTab === 'overview' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Customer Profile & Tax Info
              </button>
              <button
                onClick={() => setDetailTab('invoices')}
                className={`py-3 font-semibold text-xs border-b-2 flex items-center gap-1.5 transition ${detailTab === 'invoices' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <span>Invoice History</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold">
                  {selectedCustomer.invoices?.length || 0}
                </span>
              </button>
            </div>

            {/* Drawer Body Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {detailTab === 'overview' ? (
                <div className="space-y-4">
                  {/* Address and Contact Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Billing Address Card */}
                    <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wider">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>Billing Address</span>
                      </div>
                      <p className="text-slate-700 font-medium leading-relaxed">
                        {selectedCustomer.billingAddress?.street || 'No street address specified'}<br />
                        {selectedCustomer.billingAddress?.city || 'Chennai'}, {selectedCustomer.billingAddress?.state || 'Tamil Nadu'}
                        {selectedCustomer.billingAddress?.pincode ? ` - ${selectedCustomer.billingAddress.pincode}` : ''}
                      </p>
                      <div className="pt-2 text-[11px] text-slate-500 font-mono">
                        State Code: <strong>{selectedCustomer.billingAddress?.stateCode || '33'}</strong>
                      </div>
                    </div>

                    {/* Primary Contact Card */}
                    <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wider">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Primary Contact</span>
                      </div>
                      <div className="space-y-1 text-slate-700">
                        <div>Person: <strong className="text-slate-900">{selectedCustomer.contactPerson || 'Not specified'}</strong></div>
                        <div>Phone: <strong className="font-mono text-slate-900">{selectedCustomer.phone || '—'}</strong></div>
                        <div>Email: <strong className="text-slate-900">{selectedCustomer.email || '—'}</strong></div>
                        <div>Terms: <strong className="text-slate-900">{selectedCustomer.paymentTerms || '30 Days Net'}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Tax & GST Credentials */}
                  <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-700 text-xs uppercase tracking-wider block mb-3">
                      Tax & Regulatory Registration
                    </span>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-slate-400 block text-[10px]">GSTIN / UIN</span>
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {selectedCustomer.gstin || 'Unregistered'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Permanent Account Number (PAN)</span>
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {selectedCustomer.pan || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Place of Supply</span>
                        <span className="font-medium text-slate-900 text-xs">
                          {selectedCustomer.billingAddress?.state || 'Tamil Nadu'} ({selectedCustomer.billingAddress?.stateCode || '33'})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Invoices History Table */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Generated Invoices ({selectedCustomer.invoices?.length || 0})
                    </span>
                    <button
                      onClick={(e) => handleCreateInvoiceForCustomer(selectedCustomer, e)}
                      className="text-xs text-blue-700 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Create New Invoice</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Invoice No</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3 text-right">Grand Total (₹)</th>
                          <th className="py-2.5 px-3 text-right">Balance Due (₹)</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedCustomer.invoices && selectedCustomer.invoices.length > 0 ? (
                          selectedCustomer.invoices.map((inv) => (
                            <tr key={inv._id} className="hover:bg-slate-50/80 transition">
                              <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                                <NavLink to={`/invoices/${inv._id}`} className="hover:underline">
                                  {inv.invoiceNumber}
                                </NavLink>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 font-mono">{formatDate(inv.invoiceDate)}</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                {formatINR(inv.grandTotal)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono">
                                {(inv.balanceDue || 0) > 0 ? (
                                  <span className="font-bold text-amber-800">{formatINR(inv.balanceDue)}</span>
                                ) : (
                                  <span className="text-emerald-700 font-semibold">₹0.00</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  inv.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  inv.paymentStatus === 'Partially Paid' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}>
                                  {inv.paymentStatus || 'Unpaid'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <NavLink
                                  to={`/invoices/${inv._id}`}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  <span>View</span>
                                  <ArrowUpRight className="w-3 h-3" />
                                </NavLink>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="py-8 text-center text-slate-400">
                              No invoices created for this customer yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">
                Customer Record: {selectedCustomer.customerId}
              </span>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition active:scale-95"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 6. Add / Edit Customer Modal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submitting) setShowModal(false);
          }}
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs relative flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">
                    {isEditing ? 'Edit Customer Profile' : 'Add New Customer Profile'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isEditing ? 'Update buyer billing details, GST credentials, and terms' : 'Register a corporate buyer, GSTIN profile, and credit terms'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
                {/* SECTION 1: Company Information */}
                <div>
                  <div className="flex items-center gap-1.5 pb-2 mb-3 border-b border-slate-100 font-bold text-slate-800 text-xs uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>1. Company Identification</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Company / Buyer Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. L&T Heavy Engineering Limited"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Customer ID</label>
                        <input
                          type="text"
                          placeholder="e.g. CUST-1081"
                          value={formData.customerId}
                          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
                        <select
                          value={formData.paymentTerms}
                          onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                        >
                          <option value="Immediate / Cash">Immediate / Cash</option>
                          <option value="15 Days Net">15 Days Net</option>
                          <option value="30 Days Net">30 Days Net</option>
                          <option value="45 Days Net">45 Days Net</option>
                          <option value="60 Days Net">60 Days Net</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Tax Information */}
                <div>
                  <div className="flex items-center gap-1.5 pb-2 mb-3 border-b border-slate-100 font-bold text-slate-800 text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>2. Tax & GST Registration</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        GSTIN / UIN
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 33AABCL1234F1Z2"
                        value={formData.gstin}
                        onChange={handleGstinChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-bold uppercase text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
                      <input
                        type="text"
                        placeholder="e.g. AABCL1234F"
                        value={formData.pan}
                        onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase().slice(0, 10) })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-semibold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">State & State Code</label>
                      <select
                        value={formData.billingAddress.stateCode}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                      >
                        {INDIAN_STATES.map((st) => (
                          <option key={st.code} value={st.code}>
                            {st.name} ({st.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Contact Information */}
                <div>
                  <div className="flex items-center gap-1.5 pb-2 mb-3 border-b border-slate-100 font-bold text-slate-800 text-xs uppercase tracking-wider">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>3. Contact Person & Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                      <input
                        type="text"
                        placeholder="e.g. Mr. R. Raghavan"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / Mobile</label>
                      <input
                        type="text"
                        placeholder="e.g. +91 98401 23456"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. accounts@client.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Address Details */}
                <div>
                  <div className="flex items-center gap-1.5 pb-2 mb-3 border-b border-slate-100 font-bold text-slate-800 text-xs uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>4. Billing Address</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                      <textarea
                        rows="2"
                        placeholder="e.g. Gate 4, Heavy Industrial Complex, Mount Poonamallee Road"
                        value={formData.billingAddress?.street || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          billingAddress: { ...formData.billingAddress, street: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition resize-y"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                        <input
                          type="text"
                          placeholder="e.g. Chennai"
                          value={formData.billingAddress?.city || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            billingAddress: { ...formData.billingAddress, city: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                        <input
                          type="text"
                          readOnly
                          value={formData.billingAddress?.state || 'Tamil Nadu'}
                          className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-xs text-slate-700 font-medium cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
                        <input
                          type="text"
                          placeholder="e.g. 600089"
                          value={formData.billingAddress?.pincode || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            billingAddress: { ...formData.billingAddress, pincode: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50/95 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg border border-slate-300 transition"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs transition active:scale-95 disabled:opacity-50"
                  >
                    {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isEditing ? 'Save Changes' : 'Create Customer Profile'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 7. Safe Delete Confirmation Dialog */}
      {deleteConfirmCust && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">Delete Customer Profile?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to delete <strong>"{deleteConfirmCust.companyName}"</strong> ({deleteConfirmCust.customerId})?
              </p>
              {(deleteConfirmCust.stats?.totalInvoices || 0) > 0 && (
                <div className="mt-2.5 p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    This customer currently has <strong>{deleteConfirmCust.stats.totalInvoices} invoices</strong> associated in historical ledgers.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCust(null)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition active:scale-95 disabled:opacity-50"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
