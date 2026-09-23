import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, IndianRupee, Calendar, CreditCard, Building } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export default function PaymentRecordModal({ isOpen, onClose, invoice, onPaymentRecorded }) {
  if (!isOpen || !invoice) return null;

  const maxDue = invoice.balanceDue !== undefined ? invoice.balanceDue : invoice.grandTotal;

  const [paymentType, setPaymentType] = useState('full'); // 'full' or 'split'
  const [amount, setAmount] = useState(maxDue > 0 ? maxDue : 0);
  const [mode, setMode] = useState('UPI');
  const [referenceNo, setReferenceNo] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleTypeChange = (type) => {
    setPaymentType(type);
    if (type === 'full') {
      setAmount(maxDue);
    } else {
      setAmount('');
    }
  };

  const remainingAfterPayment = Math.max(0, maxDue - (Number(amount) || 0));

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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-fade-in no-print">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Record Payment Receipt</h3>
              <p className="text-[11px] text-slate-500">
                Invoice: <span className="font-mono font-semibold text-slate-800">{invoice.invoiceNumber}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Due Summary Pill */}
        <div className="px-5 py-2 bg-sky-50/80 border-b border-sky-100 flex items-center justify-between text-xs">
          <span className="text-sky-900 font-medium truncate max-w-[220px]">Buyer: {invoice.buyerSnapshot?.companyName}</span>
          <span className="text-sky-900 font-bold shrink-0">
            Pending Balance: <span className="text-xs font-mono text-emerald-700 font-bold">{formatINR(maxDue)}</span>
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          {error && (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          {/* Payment Type Selection: Full vs Split */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Select Payment Option *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Option 1: Pay Full */}
              <button
                type="button"
                onClick={() => handleTypeChange('full')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  paymentType === 'full'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-slate-900 text-xs">1. Pay Full Payment</span>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    paymentType === 'full' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                  }`}>
                    {paymentType === 'full' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <div className="font-mono font-bold text-emerald-700 text-xs">
                  {formatINR(maxDue)}
                </div>
                <span className="text-[10px] text-slate-500">Settles total invoice</span>
              </button>

              {/* Option 2: Split / Partial Pay */}
              <button
                type="button"
                onClick={() => handleTypeChange('split')}
                className={`p-2.5 rounded-lg border text-left transition ${
                  paymentType === 'split'
                    ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-slate-900 text-xs">2. Split / Partial Pay</span>
                  <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    paymentType === 'split' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                  }`}>
                    {paymentType === 'split' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <div className="font-mono font-bold text-blue-700 text-xs">
                  Custom Amount
                </div>
                <span className="text-[10px] text-slate-500">Pay part now, balance later</span>
              </button>
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-semibold text-[11px]">
                Amount Being Paid (₹) *
              </label>
              {paymentType === 'split' && (
                <span className="text-[11px] font-mono text-slate-500">
                  Remaining: <strong className="text-amber-700">{formatINR(remainingAfterPayment)}</strong>
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 font-semibold text-xs">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                max={maxDue}
                required
                placeholder={paymentType === 'split' ? 'Enter amount to pay...' : ''}
                readOnly={paymentType === 'full'}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus={paymentType === 'split'}
                className={`w-full pl-7 pr-3 py-1.5 border rounded-lg font-mono text-sm font-bold text-slate-900 focus:outline-none transition ${
                  paymentType === 'full'
                    ? 'bg-slate-100/80 border-slate-200 cursor-not-allowed text-emerald-800'
                    : 'bg-white border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Payment Method / Mode & Date */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Payment Mode */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Payment Method *</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="UPI">GPay / UPI (Google Pay, PhonePe, Paytm)</option>
                <option value="Cash">Cash</option>
                <option value="NEFT">NEFT / Bank Transfer</option>
                <option value="RTGS">RTGS</option>
                <option value="IMPS">IMPS</option>
                <option value="Cheque">Cheque / Demand Draft</option>
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Payment Date *</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* UTR / Transaction / Cheque Ref */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                UPI / UTR / Reference No.
              </label>
              <input
                type="text"
                placeholder="e.g. UPI Ref / UTR / Cheque"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>

            {/* Deposit Bank */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Deposit Bank</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Karur Vysya Bank"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-[11px]">Remarks (Optional)</label>
            <input
              type="text"
              placeholder="e.g. GPay receipt received / 50% advance settlement."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{submitting ? 'Recording...' : `Confirm Payment (${formatINR(Number(amount) || 0)})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
