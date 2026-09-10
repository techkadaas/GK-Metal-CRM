import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InvoiceForm from '../components/invoice/InvoiceForm';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function InvoiceEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoice() {
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
        toast.error('Failed to load invoice for editing');
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div>
      <InvoiceForm initialData={invoice} isEdit={true} />
    </div>
  );
}
