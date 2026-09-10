import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  Eye,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import InvoiceStatusBadge from '../components/invoice/InvoiceStatusBadge';
import { useToast } from '../context/ToastContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardMetrics();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const kpis = data?.kpis || {
    totalInvoices: 0,
    thisMonthBilled: 0,
    pendingPayments: 0,
    paidAmount: 0,
    draftInvoices: 0,
    cancelledInvoices: 0
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Fast Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of your invoicing and business activity
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <NavLink
            to="/invoices/create"
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-sm transition active:scale-[0.98] border border-sky-400/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Invoice</span>
          </NavLink>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Invoices */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Invoices</span>
            <div className="p-1.5 rounded-md bg-sky-50 text-sky-700">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-slate-900">
              {kpis.totalInvoices}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">All generated</span>
          </div>
        </div>

        {/* This Month Billed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">This Month</span>
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-slate-900">
              {formatINR(kpis.thisMonthBilled)}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium font-mono">Current billing</span>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Payments</span>
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-700">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-amber-700">
              {formatINR(kpis.pendingPayments)}
            </div>
            <span className="text-[11px] text-amber-600 font-medium">Awaiting receipt</span>
          </div>
        </div>

        {/* Paid Amount */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Paid Amount</span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-emerald-700">
              {formatINR(kpis.paidAmount)}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Settled total</span>
          </div>
        </div>

        {/* Draft Invoices */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Draft Invoices</span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-slate-800">
              {kpis.draftInvoices}
            </div>
            <NavLink to="/invoices?status=Draft" className="text-[11px] text-sky-600 hover:underline font-medium">
              View drafts →
            </NavLink>
          </div>
        </div>

        {/* Cancelled Invoices */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Cancelled</span>
            <div className="p-1.5 rounded-md bg-rose-50 text-rose-700">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-slate-500">
              {kpis.cancelledInvoices}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Void invoices</span>
          </div>
        </div>
      </div>

      {/* RECENT INVOICES TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Tax Invoices</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest testing charges and laboratory billing entries
            </p>
          </div>
          <NavLink
            to="/invoices"
            className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
          >
            <span>View All Invoices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">Invoice No.</th>
                <th className="py-3 px-4">Buyer / Customer</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Amount (₹)</th>
                <th className="py-3 px-3 text-right">GST (₹)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Created By</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recentInvoices && data.recentInvoices.length > 0 ? (
                data.recentInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <NavLink
                        to={`/invoices/${inv._id}`}
                        className="font-mono font-bold text-sky-700 hover:underline"
                      >
                        {inv.invoiceNumber}
                      </NavLink>
                      {inv.metadata?.testReportRef && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          TR: {inv.metadata.testReportRef}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 truncate max-w-xs">
                        {inv.buyerSnapshot?.companyName || '—'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        GST: {inv.buyerSnapshot?.gstin || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatINR(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                      {formatINR(inv.totalTax || (inv.cgstAmount + inv.sgstAmount + inv.igstAmount))}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {inv.createdBy || 'Staff'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <NavLink
                          to={`/invoices/${inv._id}`}
                          title="View & Print"
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-md transition"
                        >
                          <Eye className="w-4 h-4" />
                        </NavLink>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No invoices recorded yet. Click "+ Create Invoice" to generate the first tax invoice.
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
