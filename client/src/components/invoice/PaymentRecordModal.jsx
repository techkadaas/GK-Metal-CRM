import React, { useState } from 'react';
import { X, CheckCircle, IndianRupee, Calendar, CreditCard, Building } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export default function PaymentRecordModal({ isOpen, onClose, invoice, onPaymentRecorded }) {
  if (!isOpen || !invoice) return null;

  const maxDue = invoice.balanceDue !== undefined ? invoice.balanceDue : invoice.grandTotal;

  const [amount, setAmount] = useState(maxDue > 0 ? maxDue : 0);
  const [mode, setMode] = useState('NEFT');
  const [referenceNo, setReferenceNo] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    if (numAmount > maxDue) {
      setError(`Payment cannot exceed current balance due of ${formatINR(maxDue)}.`);
      return;
    }

    try {
      setSubmitting(true);
      await onPaymentRecorded({
        amount: numAmount,
        mode,
        referenceNo,
        bankName,
        paymentDate: new Date(paymentDate).toISOString(),
        notes
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in no-print overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Record Payment Receipt</h3>
              <p className="text-xs text-slate-500">
                Invoice: <span className="font-mono font-semibold text-slate-800">{invoice.invoiceNumber}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Due Summary Pill */}
        <div className="px-6 py-3 bg-sky-50/70 border-b border-sky-100 flex items-center justify-between text-xs">
          <span className="text-sky-900 font-medium">Customer: {invoice.buyerSnapshot?.companyName}</span>
          <span className="text-sky-900 font-bold">
            Balance Due: <span className="text-sm font-mono text-emerald-700">{formatINR(maxDue)}</span>
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Payment Amount Received (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                max={maxDue}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg font-mono text-base font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div className="flex gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setAmount(maxDue)}
                className="text-[11px] font-semibold text-sky-600 hover:underline"
              >
                Pay Full Balance ({formatINR(maxDue)})
              </button>
              {maxDue > 5000 && (
                <>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setAmount(Math.round(maxDue / 2))}
                    className="text-[11px] text-slate-600 hover:underline"
                  >
                    50% Partial ({formatINR(Math.round(maxDue / 2))})
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Payment Mode */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Payment Mode *</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-sky-500"
              >
                <option value="NEFT">NEFT / Bank Transfer</option>
                <option value="RTGS">RTGS</option>
                <option value="IMPS">IMPS</option>
                <option value="UPI">UPI (Google Pay / PhonePe)</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Receipt Date *</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* UTR / Cheque Ref */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Transaction / UTR / Cheque No.
              </label>
              <input
                type="text"
                placeholder="e.g. HDFCN2624410984"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Deposit Bank</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Payment Notes / Remarks</label>
            <textarea
              rows="2"
              placeholder="e.g. Cleared via client account, receipt emailed."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-sky-500 resize-none"
            ></textarea>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-xs flex items-center gap-2 transition disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{submitting ? 'Recording...' : 'Confirm Payment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
