import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ClipboardList,
  PlusCircle,
  Search,
  Calendar,
  Building2,
  FileText,
  Trash2,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  FileCheck,
  AlertCircle,
  X,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

const STORAGE_KEY_REPORTS = 'gkmetal_crm_local_reports_v1';

const INITIAL_REPORTS = [
  {
    id: 'rep_1',
    reportNo: 'GK/REP/26-27/001',
    buyerId: '',
    buyerName: 'Sri Balaji Engineering Works',
    buyerContact: 'Mr. R. Balaji',
    buyerCity: 'Trichy',
    date: '2026-10-20',
    sampleDescription: 'SS304 Round Bar (Dia 40mm)',
    testType: 'Chemical & Mechanical Analysis',
    status: 'Completed',
    remarks: 'Sample complies with ASTM A276 standard specifications.',
    createdAt: '2026-10-20T10:30:00.000Z'
  },
  {
    id: 'rep_2',
    reportNo: 'GK/REP/26-27/002',
    buyerId: '',
    buyerName: 'Lakshmi Precision Metal Fab',
    buyerContact: 'Mr. K. Sundaram',
    buyerCity: 'Coimbatore',
    date: '2026-10-24',
    sampleDescription: 'Mild Steel Plate (12mm Thick)',
    testType: 'Tensile & Hardness Test',
    status: 'Completed',
    remarks: 'Yield Strength: 310 MPa, Tensile: 460 MPa. Satisfactory.',
    createdAt: '2026-10-24T14:15:00.000Z'
  }
];

export default function ReportManagementPage() {
  const toast = useToast();

  const [reports, setReports] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    buyerSelectionType: 'existing', // 'existing' | 'custom'
    buyerId: '',
    buyerName: '',
    buyerContact: '',
    buyerCity: '',
    reportNo: '',
    date: new Date().toISOString().split('T')[0],
    sampleDescription: '',
    testType: 'Chemical Analysis',
    status: 'Completed',
    remarks: ''
  });

  // Load saved reports and customers
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REPORTS);
      if (saved) {
        setReports(JSON.parse(saved));
      } else {
        setReports(INITIAL_REPORTS);
        localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(INITIAL_REPORTS));
      }
    } catch (e) {
      setReports(INITIAL_REPORTS);
    }

    const loadCustomers = async () => {
      try {
        const res = await api.getCustomers();
        if (res.success && Array.isArray(res.data)) {
          setCustomers(res.data);
        }
      } catch (err) {
        console.error('Failed to load buyers', err);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const saveReportsToStorage = (updatedReports) => {
    setReports(updatedReports);
    try {
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(updatedReports));
    } catch (e) {
      console.error('Failed to save reports to localStorage', e);
    }
  };

  // Generate Suggested Next Report Number
  const generateNextReportNo = () => {
    const nextNum = reports.length + 1;
    const padded = String(nextNum).padStart(3, '0');
    return `GK/REP/26-27/${padded}`;
  };

  const handleOpenCreateModal = () => {
    const nextReportNo = generateNextReportNo();
    setFormData({
      buyerSelectionType: 'existing',
      buyerId: customers.length > 0 ? (customers[0]._id || customers[0].customerId || '') : '',
      buyerName: customers.length > 0 ? customers[0].companyName : '',
      buyerContact: customers.length > 0 ? (customers[0].contactPerson || '') : '',
      buyerCity: customers.length > 0 ? (customers[0].billingAddress?.city || '') : '',
      reportNo: nextReportNo,
      date: new Date().toISOString().split('T')[0],
      sampleDescription: '',
      testType: 'Chemical Analysis',
      status: 'Completed',
      remarks: ''
    });
    setShowCreateModal(true);
  };

  const handleBuyerSelectChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === 'CUSTOM_NEW') {
      setFormData(prev => ({
        ...prev,
        buyerSelectionType: 'custom',
        buyerId: '',
        buyerName: '',
        buyerContact: '',
        buyerCity: ''
      }));
      return;
    }

    const cust = customers.find(c => (c._id === selectedId || c.customerId === selectedId));
    if (cust) {
      setFormData(prev => ({
        ...prev,
        buyerSelectionType: 'existing',
        buyerId: selectedId,
        buyerName: cust.companyName || '',
        buyerContact: cust.contactPerson || '',
        buyerCity: cust.billingAddress?.city || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        buyerId: selectedId
      }));
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();

    if (!formData.reportNo.trim()) {
      toast.error('Report Number is required');
      return;
    }

    const buyerName = formData.buyerSelectionType === 'custom'
      ? formData.buyerName.trim()
      : formData.buyerName;

    if (!buyerName) {
      toast.error('Please select or specify a Buyer');
      return;
    }

    if (!formData.date) {
      toast.error('Date is required');
      return;
    }

    const newReport = {
      id: `rep_${Date.now()}`,
      reportNo: formData.reportNo.trim(),
      buyerId: formData.buyerId,
      buyerName: buyerName,
      buyerContact: formData.buyerContact,
      buyerCity: formData.buyerCity,
      date: formData.date,
      sampleDescription: formData.sampleDescription.trim(),
      testType: formData.testType,
      status: formData.status,
      remarks: formData.remarks.trim(),
      createdAt: new Date().toISOString()
    };

    const updated = [newReport, ...reports];
    saveReportsToStorage(updated);
    toast.success(`Report ${newReport.reportNo} created successfully!`);
    setShowCreateModal(false);
  };

  const handleDeleteReport = (id, reportNo) => {
    if (window.confirm(`Are you sure you want to delete report ${reportNo}?`)) {
      const updated = reports.filter(r => r.id !== id);
      saveReportsToStorage(updated);
      toast.success(`Report ${reportNo} deleted`);
      if (viewingReport && viewingReport.id === id) {
        setViewingReport(null);
      }
    }
  };

  const handlePrint = (report) => {
    setViewingReport(report);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(rep => {
      const matchesSearch =
        rep.reportNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.sampleDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.testType?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || rep.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reports, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-blue-600" />
            Report Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, track, and manage inspection & material testing reports for buyers
          </p>
        </div>

        {/* Primary Action Button */}
        <div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Report</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reports</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{reports.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Reports</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {reports.filter(r => r.status === 'Completed').length}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unique Buyers</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">
              {new Set(reports.map(r => r.buyerName)).size}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Report No, Buyer Name, Test type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Reports Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No reports found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'All'
                ? 'Try adjusting your search query or status filter.'
                : 'Get started by creating your first material test or inspection report.'}
            </p>
            <div className="mt-5">
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Report</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Report No</th>
                  <th className="py-3.5 px-4">Buyer / Customer</th>
                  <th className="py-3.5 px-4">Report Date</th>
                  <th className="py-3.5 px-4">Sample / Test Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-blue-50/30 transition group cursor-default"
                  >
                    {/* Report No */}
                    <td className="py-3.5 px-4 font-bold text-blue-600 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>{report.reportNo}</span>
                    </td>

                    {/* Buyer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{report.buyerName}</div>
                      {report.buyerCity && (
                        <div className="text-[11px] text-slate-400">{report.buyerCity}</div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {formatDate(report.date)}
                    </td>

                    {/* Sample / Test */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700">
                        {report.testType || 'Testing Report'}
                      </div>
                      {report.sampleDescription && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {report.sampleDescription}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          report.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : report.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            report.status === 'Completed'
                              ? 'bg-emerald-500'
                              : report.status === 'Pending'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {report.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingReport(report)}
                          title="View Report Preview"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(report)}
                          title="Print Report"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id, report.reportNo)}
                          title="Delete Report"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE REPORT MODAL */}
      {showCreateModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Create New Report</h3>
                    <p className="text-xs text-slate-500">Provide buyer, report no, and report date</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* 1. Buyer Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      Buyer Selection <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          buyerSelectionType:
                            prev.buyerSelectionType === 'existing' ? 'custom' : 'existing',
                          buyerName: '',
                          buyerId: ''
                        }))
                      }
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      {formData.buyerSelectionType === 'existing'
                        ? '+ Enter custom buyer'
                        : 'Select registered buyer'}
                    </button>
                  </div>

                  {formData.buyerSelectionType === 'existing' ? (
                    <select
                      value={formData.buyerId}
                      onChange={handleBuyerSelectChange}
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium cursor-pointer"
                    >
                      {customers.length === 0 ? (
                        <option value="">No buyers found in system</option>
                      ) : (
                        customers.map((c) => (
                          <option key={c._id || c.customerId} value={c._id || c.customerId}>
                            {c.companyName} {c.billingAddress?.city ? `(${c.billingAddress.city})` : ''}
                          </option>
                        ))
                      )}
                      <option value="CUSTOM_NEW">+ Add/type new buyer...</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Enter buyer / company name..."
                      value={formData.buyerName}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, buyerName: e.target.value }))
                      }
                      required
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                    />
                  )}
                </div>

                {/* 2. Report No & 3. Date in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Report No */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Report No <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. GK/REP/26-27/001"
                        value={formData.reportNo}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, reportNo: e.target.value }))
                        }
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Report Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, date: e.target.value }))
                        }
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Sample / Material Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sample / Material Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SS304 Pipe / MS Flange / Aluminium Ingot"
                    value={formData.sampleDescription}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, sampleDescription: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Test Type & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Test Type
                    </label>
                    <select
                      value={formData.testType}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, testType: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Chemical Analysis">Chemical Analysis</option>
                      <option value="Tensile & Mechanical Test">Tensile & Mechanical Test</option>
                      <option value="Hardness Testing (BHN/HRC)">Hardness Testing (BHN/HRC)</option>
                      <option value="PMI Testing">PMI Testing</option>
                      <option value="Ultrasonic Testing">Ultrasonic Testing</option>
                      <option value="Microstructure & Metallography">Microstructure & Metallography</option>
                      <option value="General Inspection">General Inspection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Report Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, status: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>

                {/* Remarks / Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Remarks / Findings
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter observation, standard specification, or heat/batch number..."
                    value={formData.remarks}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, remarks: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Modal Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 active:scale-[0.98] transition cursor-pointer"
                  >
                    Create Report
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* REPORT PREVIEW MODAL */}
      {viewingReport &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
              {/* Preview Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 no-print">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-slate-800">Report Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => setViewingReport(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Report Document */}
              <div className="p-8 overflow-y-auto space-y-6 text-slate-800">
                {/* Header Branding */}
                <div className="border-b-2 border-slate-800 pb-4 text-center">
                  <h2 className="text-xl font-black text-slate-900 tracking-wider uppercase">
                    GK METAL TESTING LAB
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Inspection, Metallurgical & Physical Testing Services
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Trichy, Tamil Nadu • Contact: gkmetaltestinglab@gmail.com
                  </p>
                </div>

                {/* Report Key Info */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block uppercase text-[10px] font-bold">Report Number</span>
                    <span className="font-black text-sm text-blue-700">{viewingReport.reportNo}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block uppercase text-[10px] font-bold">Date of Report</span>
                    <span className="font-bold text-slate-800">{formatDate(viewingReport.date)}</span>
                  </div>
                </div>

                {/* Buyer Information */}
                <div className="border border-slate-200 rounded-xl p-4">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block mb-1">
                    Buyer / Customer Details
                  </span>
                  <div className="text-sm font-bold text-slate-800">{viewingReport.buyerName}</div>
                  {viewingReport.buyerContact && (
                    <div className="text-xs text-slate-600 mt-0.5">Contact: {viewingReport.buyerContact}</div>
                  )}
                  {viewingReport.buyerCity && (
                    <div className="text-xs text-slate-500 mt-0.5">Location: {viewingReport.buyerCity}</div>
                  )}
                </div>

                {/* Test & Sample Details */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Inspection & Test Summary
                  </span>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Test Carried Out</span>
                      <span className="font-semibold text-slate-800">{viewingReport.testType}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Status</span>
                      <span className="font-bold text-emerald-600">{viewingReport.status}</span>
                    </div>
                    {viewingReport.sampleDescription && (
                      <div className="col-span-2">
                        <span className="text-slate-500 block">Sample Description</span>
                        <span className="font-medium text-slate-700">{viewingReport.sampleDescription}</span>
                      </div>
                    )}
                  </div>
                  {viewingReport.remarks && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 block">Observations / Remarks:</span>
                      <p className="text-slate-700 mt-0.5">{viewingReport.remarks}</p>
                    </div>
                  )}
                </div>

                {/* Sign-off */}
                <div className="pt-8 flex justify-between items-end text-xs">
                  <div>
                    <p className="text-[11px] text-slate-400">Computer Generated Test Report</p>
                  </div>
                  <div className="text-right">
                    <div className="w-32 border-b border-slate-400 mb-1"></div>
                    <span className="font-bold text-slate-700">Authorised Signatory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
