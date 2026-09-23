import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Building2, ArrowRight, X } from 'lucide-react';
import { api } from '../../services/api';
import { formatINR } from '../../utils/formatters';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchAllData();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [invRes, custRes] = await Promise.all([
        api.getInvoices(),
        api.getCustomers()
      ]);
      if (invRes.success) setInvoices(invRes.data || []);
      if (custRes.success) setCustomers(custRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredInvoices = q
    ? invoices.filter(
        i =>
          i.invoiceNumber?.toLowerCase().includes(q) ||
          i.buyerSnapshot?.companyName?.toLowerCase().includes(q) ||
          i.buyerSnapshot?.gstin?.toLowerCase().includes(q)
      ).slice(0, 5)
    : invoices.slice(0, 3);

  const filteredCustomers = q
    ? customers.filter(
        c =>
          c.companyName?.toLowerCase().includes(q) ||
          c.gstin?.toLowerCase().includes(q) ||
          c.contactPerson?.toLowerCase().includes(q)
      ).slice(0, 4)
    : customers.slice(0, 2);

  const handleSelectInvoice = (id) => {
    navigate(`/invoices/${id}`);
    onClose();
  };

  const handleSelectCustomer = (id) => {
    navigate(`/customers`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search invoice number (e.g. GK/INV/26-27/066), buyer, GSTIN, testing service..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-800 text-sm focus:outline-none placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-slate-200 text-slate-600 rounded font-mono">
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Invoices Group */}
          {filteredInvoices.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                Invoices
              </div>
              <div className="space-y-1">
                {filteredInvoices.map((inv) => (
                  <button
                    key={inv._id}
                    onClick={() => handleSelectInvoice(inv._id)}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-xs font-medium text-slate-800 truncate">
                        {inv.buyerSnapshot?.companyName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-semibold text-slate-900">
                        {formatINR(inv.grandTotal)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers Group */}
          {filteredCustomers.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Customers & Buyers
              </div>
              <div className="space-y-1">
                {filteredCustomers.map((cust) => (
                  <button
                    key={cust._id}
                    onClick={() => handleSelectCustomer(cust._id)}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-100 transition group"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {cust.companyName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        GSTIN: {cust.gstin || '—'}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredInvoices.length === 0 && filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No matching records found for "{query}".
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Navigate with keyboard</span>
            <span>•</span>
            <span>Press <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px]">ESC</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
