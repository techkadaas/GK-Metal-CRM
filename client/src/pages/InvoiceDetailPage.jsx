import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  Printer,
  Download,
  Edit,
  Copy,
  Share2,
  ArrowLeft,
  IndianRupee
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import InvoiceDocument from '../components/invoice/InvoiceDocument';
import InvoiceStatusBadge from '../components/invoice/InvoiceStatusBadge';
import PaymentRecordModal from '../components/invoice/PaymentRecordModal';
import ShareInvoiceModal from '../components/invoice/ShareInvoiceModal';
import { api } from '../services/api';
import { formatINR, formatDate, formatInvoiceNumber } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoiceById(id);
      if (res.success && res.data) {
        setInvoice(res.data);
      } else {
        toast.error('Invoice not found');
        navigate('/invoices');
      }
    } catch (e) {
      toast.error('Failed to load invoice');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  // Direct Print Trigger
  const handlePrint = () => {
    window.print();
  };

  // High-Resolution A4 PDF Generation
  const handleDownloadPDF = async () => {
    const docElement = document.getElementById('tax-invoice-printable');
    if (!docElement) {
      toast.error('Invoice element not found for rendering');
      return;
    }

    try {
      setDownloading(true);
      toast.info('Generating high-resolution A4 PDF...');

      const canvas = await html2canvas(docElement, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      const safeFilename = `${invoice.invoiceNumber.replace(/[\/\\]/g, '_')}_Tax_Invoice.pdf`;
      pdf.save(safeFilename);

      toast.success(`Downloaded ${safeFilename}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF. You can also use the browser Print -> Save as PDF option.');
    } finally {
      setDownloading(false);
    }
  };

  // Duplicate Invoice
  const handleDuplicate = async () => {
    try {
      const res = await api.duplicateInvoice(invoice._id);
      if (res.success && res.data) {
        toast.success(`Duplicated to new draft ${res.data.invoiceNumber}`);
        navigate(`/invoices/${res.data._id}`);
      }
    } catch (e) {
      toast.error('Failed to duplicate invoice');
    }
  };


  // Record Payment Callback
  const handlePaymentRecorded = async (paymentData) => {
    const res = await api.recordPayment(invoice._id, paymentData);
    if (res.success) {
      toast.success(`Payment of ${formatINR(paymentData.amount)} recorded!`);
      setInvoice(res.data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500">Loading invoice document...</p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Action & Breadcrumb Bar (Hidden during Print) */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <NavLink
            to="/invoices"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="Back to All Invoices"
          >
            <ArrowLeft className="w-5 h-5" />
          </NavLink>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold font-mono text-slate-900">
                {formatInvoiceNumber(invoice.invoiceNumber)}
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Buyer: <span className="font-semibold text-slate-800">{invoice.buyerSnapshot?.companyName}</span> • Date: {formatDate(invoice.invoiceDate)}
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Invoice</span>
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Exporting PDF...' : 'Download PDF'}</span>
          </button>

          {/* Record Payment */}
          {invoice.paymentStatus !== 'Paid' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition"
            >
              <IndianRupee className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}

          {/* Share */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition"
          >
            <Share2 className="w-4 h-4 text-slate-600" />
            <span>Share</span>
          </button>

          {/* Edit */}
          <NavLink
            to={`/invoices/${invoice._id}/edit`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition"
          >
            <Edit className="w-4 h-4 text-slate-600" />
            <span>Edit</span>
          </NavLink>

          {/* Duplicate */}
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-lg transition"
          >
            <Copy className="w-4 h-4 text-slate-600" />
            <span>Duplicate</span>
          </button>
        </div>
      </div>

      {/* Printable Tax Invoice Document Container */}
      <div className="bg-slate-200/90 p-4 sm:p-6 rounded-xl border border-slate-300 shadow-inner overflow-x-auto print-container flex justify-center">
        <InvoiceDocument invoice={invoice} id="tax-invoice-printable" />
      </div>

      {/* Modals */}
      <PaymentRecordModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoice={invoice}
        onPaymentRecorded={handlePaymentRecorded}
      />

      <ShareInvoiceModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        invoice={invoice}
      />
    </div>
  );
}
