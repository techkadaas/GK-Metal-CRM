import React, { useState } from 'react';
import { X, MessageSquare, Mail, Copy, Check, ExternalLink } from 'lucide-react';
import { formatINR, formatDate } from '../../utils/formatters';

export default function ShareInvoiceModal({ isOpen, onClose, invoice }) {
  if (!isOpen || !invoice) return null;

  const [copied, setCopied] = useState(false);

  const buyerName = invoice.buyerSnapshot?.companyName || 'Valued Customer';
  const buyerPhone = invoice.buyerSnapshot?.phone || '';
  const buyerEmail = invoice.buyerSnapshot?.email || '';
  const invNumber = invoice.invoiceNumber;
  const grandTotal = formatINR(invoice.grandTotal);
  const invDate = formatDate(invoice.invoiceDate);

  const messageText = `Dear ${buyerName},\n\nPlease find GST Tax Invoice *${invNumber}* dated ${invDate} for *${grandTotal}* from *GK Metal Testing Lab*.\n\nBank: HDFC Bank Ltd | A/c: 50200034891278 | IFSC: HDFC0001234\n\nKindly acknowledge receipt and arrange payment as per terms.\n\nThank you,\nAccounts Desk - GK Metal Testing Lab`;

  const cleanPhone = buyerPhone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}&text=${encodeURIComponent(messageText)}`;
  const mailtoUrl = `mailto:${buyerEmail}?subject=${encodeURIComponent(`GK Metal Testing Lab - Tax Invoice ${invNumber}`)}&body=${encodeURIComponent(messageText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in no-print overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Share Tax Invoice</h3>
              <p className="text-xs text-slate-500">
                Invoice <span className="font-mono font-semibold text-slate-800">{invNumber}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Quick Sharing Channels */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send on WhatsApp</span>
            </a>

            <a
              href={mailtoUrl}
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition"
            >
              <Mail className="w-4 h-4" />
              <span>Email to Client</span>
            </a>
          </div>

          {/* Formatted Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-700">Pre-composed Invoice Summary</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] whitespace-pre-line leading-relaxed select-all">
              {messageText}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
