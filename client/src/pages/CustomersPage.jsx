import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import {
  Building2,
  PlusCircle,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Edit,
  Trash2,
  X,
  IndianRupee,
  CheckCircle2,
  Calendar,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import { INDIAN_STATES } from '../utils/taxCalculator';
import { useToast } from '../context/ToastContext';

export default function CustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Modal Form state
  const [formData, setFormData] = useState({
    customerId: '',
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    pan: '',
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
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers({ search: searchQuery });
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch (e) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setFormData({
      customerId: '',
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      gstin: '',
      pan: '',
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
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (cust) => {
    setIsEditing(true);
    setFormData({
      _id: cust._id,
      customerId: cust.customerId,
      companyName: cust.companyName,
      contactPerson: cust.contactPerson || '',
      email: cust.email || '',
      phone: cust.phone || '',
      gstin: cust.gstin || '',
      pan: cust.pan || '',
      billingAddress: {
        street: cust.billingAddress?.street || '',
        city: cust.billingAddress?.city || 'Chennai',
        state: cust.billingAddress?.state || 'Tamil Nadu',
        stateCode: cust.billingAddress?.stateCode || '33',
        pincode: cust.billingAddress?.pincode || ''
      },
      shippingAddress: {
        street: cust.shippingAddress?.street || '',
        city: cust.shippingAddress?.city || 'Chennai',
        state: cust.shippingAddress?.state || 'Tamil Nadu',
        stateCode: cust.shippingAddress?.stateCode || '33',
        pincode: cust.shippingAddress?.pincode || ''
      }
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast.error('Company Name is required');
      return;
    }

    try {
      if (isEditing) {
        const res = await api.updateCustomer(formData._id, formData);
        if (res.success) {
          toast.success(`Customer ${formData.companyName} updated!`);
          setShowModal(false);
          fetchCustomers();
        }
      } else {
        const res = await api.createCustomer(formData);
        if (res.success) {
          toast.success(`Customer ${formData.companyName} created!`);
          setShowModal(false);
          fetchCustomers();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save customer');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete customer "${name}"?`)) {
      try {
        const res = await api.deleteCustomer(id);
        if (res.success) {
          toast.success('Customer deleted');
          fetchCustomers();
        }
      } catch (e) {
        toast.error('Failed to delete customer');
      }
    }
  };

  const handleViewCustomerDetail = async (id) => {
    try {
      const res = await api.getCustomerById(id);
      if (res.success && res.data) {
        setSelectedCustomer(res.data);
      }
    } catch (e) {
      toast.error('Failed to load customer details');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage client accounts, GSTIN profiles, and outstanding ledgers
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-sm transition active:scale-[0.98] border border-sky-400/30"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by company, GSTIN, contact person, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 bg-white"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {customers.length} registered customers
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">Customer ID & Name</th>
                <th className="py-3 px-4">GSTIN / PAN</th>
                <th className="py-3 px-3">Contact Details</th>
                <th className="py-3 px-3 text-center">Invoices</th>
                <th className="py-3 px-3 text-right">Total Billed (₹)</th>
                <th className="py-3 px-3 text-right">Outstanding Due (₹)</th>
                <th className="py-3 px-3 text-center">Last Invoice</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleViewCustomerDetail(c._id)}
                        className="font-bold text-slate-900 hover:text-sky-600 text-left block"
                      >
                        {c.companyName}
                      </button>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold">
                        {c.customerId} • {c.billingAddress?.city || 'Chennai'} ({c.billingAddress?.stateCode || '33'})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-slate-800">{c.gstin || '—'}</span>
                      {c.pan && <div className="text-[10px] text-slate-400">PAN: {c.pan}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{c.contactPerson || '—'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c.phone || c.email || '—'}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">
                      {c.stats?.totalInvoices || 0}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(c.stats?.totalBilled || 0)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                      {(c.stats?.outstandingBalance || 0) > 0 ? (
                        <span className="text-amber-700">{formatINR(c.stats.outstandingBalance)}</span>
                      ) : (
                        <span className="text-emerald-700">₹0.00 (Settled)</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap text-slate-600">
                      {formatDate(c.stats?.lastInvoiceDate)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewCustomerDetail(c._id)}
                          title="View Ledger & History"
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-md transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          title="Edit Customer"
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id, c.companyName)}
                          title="Delete Customer"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400">
                    No customers found. Click "+ Add Customer" to create your first buyer profile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-xs max-h-[90vh] flex flex-col">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-sky-400 font-bold uppercase">
                  {selectedCustomer.customerId}
                </span>
                <h2 className="text-base font-bold text-white">{selectedCustomer.companyName}</h2>
                <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                  GSTIN: {selectedCustomer.gstin || '—'} • State Code: {selectedCustomer.billingAddress?.stateCode || '33'}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Financial Metrics Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Total Billed</span>
                  <p className="text-base font-mono font-bold text-slate-900">
                    {formatINR(selectedCustomer.stats?.totalBilled || 0)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold">Paid Settlements</span>
                  <p className="text-base font-mono font-bold text-emerald-800">
                    {formatINR(selectedCustomer.stats?.totalPaid || 0)}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-[10px] text-amber-700 uppercase font-bold">Pending Dues</span>
                  <p className="text-base font-mono font-bold text-amber-800">
                    {formatINR(selectedCustomer.stats?.outstandingBalance || 0)}
                  </p>
                </div>
              </div>

              {/* Address Details */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Billing Address</span>
                  <p className="text-slate-600">
                    {selectedCustomer.billingAddress?.street || '—'}<br />
                    {selectedCustomer.billingAddress?.city}, {selectedCustomer.billingAddress?.state} - {selectedCustomer.billingAddress?.pincode}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block mb-1">Contact Details</span>
                  <p className="text-slate-600">
                    Contact: <strong>{selectedCustomer.contactPerson || '—'}</strong><br />
                    Phone: {selectedCustomer.phone || '—'}<br />
                    Email: {selectedCustomer.email || '—'}
                  </p>
                </div>
              </div>

              {/* Invoices History Table */}
              <div>
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Invoice History ({selectedCustomer.invoices?.length || 0})
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold">
                      <tr>
                        <th className="py-2 px-3">Invoice No</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Amount (₹)</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedCustomer.invoices && selectedCustomer.invoices.length > 0 ? (
                        selectedCustomer.invoices.map(inv => (
                          <tr key={inv._id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-sky-700">{inv.invoiceNumber}</td>
                            <td className="py-2 px-3 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatINR(inv.grandTotal)}</td>
                            <td className="py-2 px-3 text-center font-semibold text-slate-700">{inv.status}</td>
                            <td className="py-2 px-3 text-center">
                              <NavLink
                                to={`/invoices/${inv._id}`}
                                className="text-sky-600 hover:underline font-semibold"
                              >
                                View Invoice →
                              </NavLink>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-slate-400">
                            No invoices generated for this customer yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add / Edit Customer Modal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-transparent"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden text-xs relative flex flex-col max-h-[calc(100vh-2rem)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50/95 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">
                    {isEditing ? 'Edit Customer Profile' : 'Register New Customer'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Enter client information and billing details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto flex-1 min-h-0">
                {/* Company Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Company / Buyer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. L&T Heavy Engineering Limited"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                  />
                </div>

                {/* GSTIN & State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">GSTIN</label>
                    <input
                      type="text"
                      placeholder="e.g. 33AABCL1234F1Z2"
                      value={formData.gstin}
                      onChange={(e) => {
                        const gstin = e.target.value.toUpperCase();
                        const code = gstin.substring(0, 2);
                        const matched = INDIAN_STATES.find(s => s.code === code);
                        setFormData(prev => ({
                          ...prev,
                          gstin,
                          pan: gstin.length >= 12 ? gstin.substring(2, 12) : prev.pan,
                          billingAddress: {
                            ...prev.billingAddress,
                            stateCode: code || prev.billingAddress.stateCode,
                            state: matched ? matched.name : prev.billingAddress.state
                          },
                          shippingAddress: {
                            ...prev.shippingAddress,
                            stateCode: code || prev.shippingAddress.stateCode,
                            state: matched ? matched.name : prev.shippingAddress.state
                          }
                        }));
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-xs font-bold uppercase text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">State & State Code</label>
                    <select
                      value={formData.billingAddress.stateCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const matched = INDIAN_STATES.find(s => s.code === code);
                        const stateName = matched ? matched.name : 'Tamil Nadu';
                        setFormData({
                          ...formData,
                          billingAddress: { ...formData.billingAddress, stateCode: code, state: stateName },
                          shippingAddress: { ...formData.shippingAddress, stateCode: code, state: stateName }
                        });
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st.code} value={st.code}>
                          {st.name} ({st.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contact Person & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. R. Raghavan"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98401 23456"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. raghavan@lnthe.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                  />
                </div>

                {/* Address (Big Textarea) */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Address</label>
                  <textarea
                    rows="3"
                    placeholder="e.g. Gate 4, Heavy Industrial Complex, Mount Poonamallee Road, Manapakkam, Chennai - 600089"
                    value={formData.billingAddress?.street || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      billingAddress: { ...formData.billingAddress, street: e.target.value },
                      shippingAddress: { ...formData.shippingAddress, street: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition resize-y"
                  ></textarea>
                </div>
              </div>

              {/* Fixed Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50/95 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg border border-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition active:scale-[0.98]"
                >
                  {isEditing ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
