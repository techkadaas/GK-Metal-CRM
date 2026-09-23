import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Plus,
  Trash2,
  Copy,
  Save,
  CheckCircle2,
  Building2,
  Calendar,
  FileText,
  Hash,
  Calculator,
  UserPlus,
  ShieldCheck,
  CreditCard,
  MapPin,
  Sparkles,
  Info,
  Check,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import InvoiceDocument from './InvoiceDocument';
import { calculateInvoiceTotals, INDIAN_STATES } from '../../utils/taxCalculator';
import { convertNumberToWords } from '../../utils/numberToWords';
import { formatINR } from '../../utils/formatters';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';

export default function InvoiceForm({ initialData = null, isEdit = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { settings } = useSettings();
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  // New customer quick inline modal state
  const [newCustForm, setNewCustForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    state: 'Tamil Nadu',
    stateCode: '33',
    street: '',
    city: '',
    pincode: ''
  });

  // Invoice Form State
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    sequenceNumber: 0,
    financialYear: '26-27',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'Generated',
    paymentStatus: 'Unpaid',
    metadata: {
      deliveryNote: '',
      modeOfPayment: '30 Days',
      supplierRef: '',
      otherRef: '',
      buyerOrderNo: '',
      orderDate: '',
      despatchedThrough: '',
      destination: '',
      termsOfDelivery: '',
      sampleBatchRef: '',
      testReportRef: ''
    },
    customer: '',
    buyerSnapshot: {
      companyName: '',
      contactPerson: '',
      email: '',
      phone: '',
      gstin: '',
      pan: '',
      billingAddress: {
        street: '',
        city: '',
        state: 'Tamil Nadu',
        stateCode: '33',
        pincode: ''
      },
      shippingAddress: {
        street: '',
        city: '',
        state: 'Tamil Nadu',
        stateCode: '33',
        pincode: ''
      }
    },
    items: [
      {
        slNo: 1,
        serviceId: '',
        description: '',
        testedDate: '',
        dayType: '',
        hsnSac: '998346',
        quantity: 1,
        rate: 0,
        per: 'No.',
        discountPercent: 0,
        taxableAmount: 0
      }
    ],
    isInterstate: false,
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    manualRoundOff: null,
    notes: '',
    declaration: '1) Cheque, DD / RTGS in favour of GK Metal Testing Lab Payable at Trichy.\n2) GST category: (998346) technical testing and analysis service.\n3) We hereby declare that, there is no transfer of property in goods involved in execution of this contract which is leviable to tax as sale of goods. "This is purely a service contract."\n4) All disputes Subject to Chennai Jurisdiction.'
  });

  // Fetch initial dependencies
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, servRes] = await Promise.all([
          api.getCustomers(),
          api.getServices()
        ]);
        const loadedCustomers = custRes?.data || [];
        if (custRes?.success) setCustomers(loadedCustomers);
        if (servRes?.success) setServices(servRes.data || []);

        // Pre-select customer if navigating from Customers page with customerId
        const targetCustomerId = searchParams.get('customerId') || location.state?.customerId;
        if (targetCustomerId && !isEdit && !initialData) {
          const matched = loadedCustomers.find(c => c._id === targetCustomerId || c.customerId === targetCustomerId);
          if (matched) {
            setFormData(prev => ({
              ...prev,
              customer: matched._id,
              buyerSnapshot: {
                companyName: matched.companyName,
                contactPerson: matched.contactPerson || '',
                email: matched.email || '',
                phone: matched.phone || '',
                gstin: matched.gstin || '',
                pan: matched.pan || '',
                billingAddress: {
                  street: matched.billingAddress?.street || '',
                  city: matched.billingAddress?.city || '',
                  state: matched.billingAddress?.state || 'Tamil Nadu',
                  stateCode: matched.billingAddress?.stateCode || '33',
                  pincode: matched.billingAddress?.pincode || ''
                },
                shippingAddress: {
                  street: matched.shippingAddress?.street || matched.billingAddress?.street || '',
                  city: matched.shippingAddress?.city || matched.billingAddress?.city || '',
                  state: matched.shippingAddress?.state || matched.billingAddress?.state || 'Tamil Nadu',
                  stateCode: matched.shippingAddress?.stateCode || matched.billingAddress?.stateCode || '33',
                  pincode: matched.shippingAddress?.pincode || matched.billingAddress?.pincode || ''
                }
              }
            }));
          }
        }

        // If creating new invoice, fetch next invoice number
        if (!isEdit && !initialData) {
          const nextRes = await api.getNextInvoiceNumber();
          if (nextRes?.success && nextRes.data) {
            setFormData(prev => ({
              ...prev,
              invoiceNumber: nextRes.data.nextInvoiceNumber || nextRes.data.invoiceNumber || '',
              sequenceNumber: nextRes.data.sequenceNumber,
              financialYear: nextRes.data.financialYear
            }));
          }
        }
      } catch (err) {
        console.error('Error loading invoice form dependencies:', err);
      }
    };
    fetchData();
  }, [isEdit, initialData, searchParams, location.state]);

  // Populate data if editing
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        invoiceDate: initialData.invoiceDate ? initialData.invoiceDate.split('T')[0] : prev.invoiceDate,
        dueDate: initialData.dueDate ? initialData.dueDate.split('T')[0] : prev.dueDate,
        buyerSnapshot: {
          ...prev.buyerSnapshot,
          ...(initialData.buyerSnapshot || {})
        },
        items: initialData.items && initialData.items.length > 0 ? initialData.items : prev.items
      }));
    }
  }, [initialData]);

  // Customer dropdown selection handler
  const handleCustomerSelect = (customerId) => {
    const selected = customers.find(c => c._id === customerId);
    if (!selected) {
      setFormData(prev => ({
        ...prev,
        customer: '',
        buyerSnapshot: {
          companyName: '',
          contactPerson: '',
          email: '',
          phone: '',
          gstin: '',
          pan: '',
          billingAddress: { street: '', city: '', state: 'Tamil Nadu', stateCode: '33', pincode: '' },
          shippingAddress: { street: '', city: '', state: 'Tamil Nadu', stateCode: '33', pincode: '' }
        }
      }));
      return;
    }

    const companyStateCode = settings?.address?.stateCode || '33';
    const custStateCode = selected.billingAddress?.stateCode || '33';
    const isInter = String(custStateCode).trim() !== String(companyStateCode).trim();

    setFormData(prev => ({
      ...prev,
      customer: selected._id,
      isInterstate: isInter,
      buyerSnapshot: {
        companyName: selected.companyName || '',
        contactPerson: selected.contactPerson || '',
        email: selected.email || '',
        phone: selected.phone || '',
        gstin: selected.gstin || '',
        pan: selected.pan || '',
        billingAddress: {
          street: selected.billingAddress?.street || '',
          city: selected.billingAddress?.city || '',
          state: selected.billingAddress?.state || 'Tamil Nadu',
          stateCode: selected.billingAddress?.stateCode || '33',
          pincode: selected.billingAddress?.pincode || ''
        },
        shippingAddress: {
          street: selected.shippingAddress?.street || selected.billingAddress?.street || '',
          city: selected.shippingAddress?.city || selected.billingAddress?.city || '',
          state: selected.shippingAddress?.state || selected.billingAddress?.state || 'Tamil Nadu',
          stateCode: selected.shippingAddress?.stateCode || selected.billingAddress?.stateCode || '33',
          pincode: selected.shippingAddress?.pincode || selected.billingAddress?.pincode || ''
        }
      }
    }));
  };

  // Line item handlers
  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      const targetItem = { ...updatedItems[index], [field]: value };

      if (field === 'quantity' || field === 'rate' || field === 'discountPercent') {
        const qty = Number(field === 'quantity' ? value : targetItem.quantity) || 0;
        const rate = Number(field === 'rate' ? value : targetItem.rate) || 0;
        const disc = Number(field === 'discountPercent' ? value : targetItem.discountPercent) || 0;
        const gross = qty * rate;
        const discAmt = gross * (disc / 100);
        targetItem.taxableAmount = Math.max(0, gross - discAmt);
      }

      updatedItems[index] = targetItem;
      return { ...prev, items: updatedItems };
    });
  };

  const handleSelectServiceForIndex = (serviceId, index) => {
    const s = services.find(item => item._id === serviceId);
    if (!s) return;

    setFormData(prev => {
      const updatedItems = [...prev.items];
      const qty = updatedItems[index].quantity || 1;
      const rate = s.defaultRate || 0;
      const disc = updatedItems[index].discountPercent || 0;
      const gross = qty * rate;
      const taxable = gross - (gross * (disc / 100));

      updatedItems[index] = {
        ...updatedItems[index],
        serviceId: s._id,
        description: s.description || s.name,
        hsnSac: s.hsnSac || '998346',
        rate: rate,
        per: s.unit || 'No.',
        taxableAmount: taxable
      };
      return { ...prev, items: updatedItems };
    });
  };

  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          slNo: prev.items.length + 1,
          serviceId: '',
          description: '',
          testedDate: '',
          dayType: '',
          hsnSac: '998346',
          quantity: 1,
          rate: 0,
          per: 'No.',
          discountPercent: 0,
          taxableAmount: 0
        }
      ]
    }));
  };

  const duplicateItemRow = (index) => {
    setFormData(prev => {
      const itemToDup = { ...prev.items[index], slNo: prev.items.length + 1 };
      return {
        ...prev,
        items: [...prev.items, itemToDup]
      };
    });
  };

  const removeItemRow = (index) => {
    if (formData.items.length <= 1) {
      toast.error('Invoice must have at least one line item.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Real-time calculation computation
  const calculatedMath = useMemo(() => {
    return calculateInvoiceTotals({
      items: formData.items,
      companyStateCode: settings?.address?.stateCode || '33',
      buyerStateCode: formData.buyerSnapshot?.billingAddress?.stateCode || '33',
      forcedInterstate: formData.isInterstate,
      cgstRate: formData.cgstRate || 9,
      sgstRate: formData.sgstRate || 9,
      igstRate: formData.igstRate || 18,
      manualRoundOff: formData.manualRoundOff
    });
  }, [
    formData.items,
    formData.buyerSnapshot?.billingAddress?.stateCode,
    formData.isInterstate,
    formData.cgstRate,
    formData.sgstRate,
    formData.igstRate,
    formData.manualRoundOff,
    settings
  ]);

  // Save / Submit Invoice
  const handleSubmit = async (targetStatus = 'Generated') => {
    if (!formData.buyerSnapshot?.companyName?.trim()) {
      toast.error('Please select or specify a Buyer / Customer Company Name.');
      return;
    }

    const hasValidItem = formData.items.some(it => it.description?.trim() && Number(it.quantity) > 0);
    if (!hasValidItem) {
      toast.error('Please add at least one valid testing service with a description and quantity.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        ...calculatedMath,
        status: targetStatus,
        paymentStatus: targetStatus === 'Draft' ? 'Unpaid' : formData.paymentStatus,
        amountInWords: convertNumberToWords(calculatedMath.grandTotal)
      };

      if (isEdit && initialData?._id) {
        const res = await api.updateInvoice(initialData._id, payload);
        if (res.success) {
          toast.success(`Invoice ${formData.invoiceNumber} updated successfully!`);
          navigate(`/invoices/${initialData._id}`);
        }
      } else {
        const res = await api.createInvoice(payload);
        if (res.success && res.data) {
          toast.success(`Tax Invoice ${res.data.invoiceNumber} created successfully!`);
          navigate(`/invoices/${res.data._id}`);
        }
      }
    } catch (e) {
      toast.error(e.message || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  // Inline Quick New Customer Creator
  const handleCreateQuickCustomer = async (e) => {
    e.preventDefault();
    if (!newCustForm.companyName.trim()) {
      toast.error('Customer Company Name is required');
      return;
    }

    try {
      const res = await api.createCustomer({
        companyName: newCustForm.companyName,
        contactPerson: newCustForm.contactPerson,
        email: newCustForm.email,
        phone: newCustForm.phone,
        gstin: newCustForm.gstin,
        billingAddress: {
          street: newCustForm.street,
          city: newCustForm.city,
          state: newCustForm.state,
          stateCode: newCustForm.stateCode,
          pincode: newCustForm.pincode
        },
        shippingAddress: {
          street: newCustForm.street,
          city: newCustForm.city,
          state: newCustForm.state,
          stateCode: newCustForm.stateCode,
          pincode: newCustForm.pincode
        }
      });

      if (res.success && res.data) {
        toast.success(`Customer "${res.data.companyName}" registered!`);
        setCustomers(prev => [...prev, res.data]);
        handleCustomerSelect(res.data._id);
        setShowNewCustomerModal(false);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add customer');
    }
  };

  const STEPS = [
    { id: 1, title: 'Invoice Details', subtitle: 'Invoice No, Date & References', icon: FileText },
    { id: 2, title: 'Buyer Info', subtitle: 'Customer, GSTIN & State', icon: Building2 },
    { id: 3, title: 'Testing Services', subtitle: 'Services, Rates & Items', icon: Calculator },
    { id: 4, title: 'Tax & Finalize', subtitle: 'Summary & Generation', icon: CheckCircle2 }
  ];

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.invoiceNumber?.trim()) {
        toast.error('Please enter an Invoice Number.');
        return false;
      }
      if (!formData.invoiceDate) {
        toast.error('Please select an Invoice Date.');
        return false;
      }
    } else if (step === 2) {
      if (!formData.buyerSnapshot?.companyName?.trim()) {
        toast.error('Please select or enter a Buyer / Company Name.');
        return false;
      }
    } else if (step === 3) {
      if (!formData.items || formData.items.length === 0) {
        toast.error('Please add at least one testing service line item.');
        return false;
      }
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        if (!item.description?.trim()) {
          toast.error(`Line item #${i + 1} must have a service description.`);
          return false;
        }
        if (Number(item.rate) < 0 || isNaN(Number(item.rate))) {
          toast.error(`Line item #${i + 1} must have a valid rate.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (stepId) => {
    if (stepId > currentStep) {
      for (let s = currentStep; s < stepId; s++) {
        if (!validateStep(s)) return;
      }
    }
    setCurrentStep(stepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3.5 animate-fade-in pb-4">
      {/* Top Stepper Header Card */}
      <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {isEdit ? 'Edit Tax Invoice' : 'Create Tax Invoice'}
            </h2>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
              {formData.invoiceNumber || 'GK/INV/...'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              Step <strong className="text-sky-700 font-mono">{currentStep}</strong> / 4
            </span>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('Draft')}
              className="px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition disabled:opacity-50"
            >
              Save Draft
            </button>
          </div>
        </div>

        {/* Horizontal Step Tracker Bar */}
        <div className="flex items-center justify-between relative max-w-2xl mx-auto pt-1">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <React.Fragment key={step.id}>
                {/* Connector Line */}
                {idx > 0 && (
                  <div className="flex-1 h-0.5 mx-2 relative">
                    <div
                      className={`h-full w-full transition-all duration-300 ${
                        currentStep >= step.id
                          ? 'bg-emerald-500'
                          : 'border-t-2 border-dashed border-slate-200'
                      }`}
                    />
                  </div>
                )}

                {/* Step Node */}
                <button
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  className="flex items-center gap-2 group focus:outline-none cursor-pointer"
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 shadow-xs ${
                      isCompleted
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-100 hover:bg-emerald-700'
                        : isActive
                        ? 'bg-sky-600 text-white ring-2 ring-sky-100 scale-105 shadow-sm shadow-sky-600/20'
                        : 'bg-white border border-slate-300 text-slate-400 group-hover:border-slate-400 group-hover:text-slate-600'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-white stroke-[2.5]" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>

                  <div className="text-left hidden sm:block">
                    <span
                      className={`text-xs font-bold block leading-tight ${
                        isActive
                          ? 'text-sky-700 font-extrabold'
                          : isCompleted
                          ? 'text-emerald-700'
                          : 'text-slate-500 group-hover:text-slate-700'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* STEP 1: INVOICE HEADER & REFERENCES */}
      {currentStep === 1 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1. Invoice Details & References
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              FY {formData.financialYear}
            </span>
          </div>

          {/* Row 1: Core Billing Details (3 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Invoice No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.invoiceNumber || ''}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/60 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Invoice Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.invoiceDate || ''}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 bg-white transition"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Mode / Terms of Payment
              </label>
              <input
                type="text"
                placeholder="e.g. 30 Days / Immediate"
                value={formData.metadata?.modeOfPayment ?? '30 Days'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, modeOfPayment: e.target.value }
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 bg-white transition"
              />
            </div>
          </div>

          {/* Row 2: References & PO Details (4 columns) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                Delivery Note
              </label>
              <input
                type="text"
                placeholder="DN-2026/089"
                value={formData.metadata?.deliveryNote || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, deliveryNote: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                Supplier&apos;s Ref.
              </label>
              <input
                type="text"
                placeholder="TR-2026-441"
                value={formData.metadata?.supplierRef || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, supplierRef: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                Buyer&apos;s Order No.
              </label>
              <input
                type="text"
                placeholder="PO/2026/1042"
                value={formData.metadata?.buyerOrderNo || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, buyerOrderNo: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                Order Dated
              </label>
              <input
                type="date"
                value={formData.metadata?.orderDate ? formData.metadata.orderDate.split('T')[0] : ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, orderDate: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
          </div>

          {/* Row 3: Dispatch & Logistics Details (4 columns) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                Despatched through
              </label>
              <input
                type="text"
                placeholder="Hand Delivery / Courier"
                value={formData.metadata?.despatchedThrough || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, despatchedThrough: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                Destination
              </label>
              <input
                type="text"
                placeholder="Trichy / Chennai"
                value={formData.metadata?.destination || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, destination: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                Terms of Delivery
              </label>
              <input
                type="text"
                placeholder="Door Delivery / Lab"
                value={formData.metadata?.termsOfDelivery || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, termsOfDelivery: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                Other Reference(s)
              </label>
              <input
                type="text"
                placeholder="Sample / Batch Ref"
                value={formData.metadata?.otherRef || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, otherRef: e.target.value }
                  })
                }
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
          </div>

          {/* Step 1 Navigation Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-xs transition active:scale-[0.98]"
            >
              <span>Next: Buyer Info</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: BUYER INFORMATION & GST */}
      {currentStep === 2 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Buyer Information & GST
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowNewCustomerModal(true)}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Register New Buyer</span>
            </button>
          </div>

          {/* Quick Customer Picker */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Select Existing Customer (Auto-Populates Details)
            </label>
            <select
              value={formData.customer || ''}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-sky-500 bg-slate-50/70 transition"
            >
              <option value="">-- Choose from saved customers catalog --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName} {c.gstin ? `(${c.gstin})` : ''} - {c.billingAddress?.state}
                </option>
              ))}
            </select>
          </div>

          {/* Editable Buyer Snapshot Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Buyer Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. L&T Heavy Engineering Limited"
                value={formData.buyerSnapshot?.companyName || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  buyerSnapshot: { ...(formData.buyerSnapshot || {}), companyName: e.target.value }
                })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 bg-white transition"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Buyer GSTIN / UIN
              </label>
              <input
                type="text"
                placeholder="33AABCL1234F1Z2"
                value={formData.buyerSnapshot?.gstin || ''}
                onChange={(e) => {
                  const gstinVal = e.target.value.toUpperCase();
                  const stateCode = gstinVal.substring(0, 2);
                  const isCodeValid = /^\d{2}$/.test(stateCode);

                  setFormData(prev => ({
                    ...prev,
                    buyerSnapshot: {
                      ...(prev.buyerSnapshot || {}),
                      gstin: gstinVal,
                      pan: gstinVal.length >= 12 ? gstinVal.substring(2, 12) : (prev.buyerSnapshot?.pan || ''),
                      billingAddress: {
                        ...(prev.buyerSnapshot?.billingAddress || {}),
                        stateCode: isCodeValid ? stateCode : (prev.buyerSnapshot?.billingAddress?.stateCode || '33')
                      }
                    },
                    isInterstate: isCodeValid ? stateCode !== (settings?.address?.stateCode || '33') : prev.isInterstate
                  }));
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-sky-500 bg-white transition"
              />
            </div>
          </div>

          {/* Address & State Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                Buyer Address
              </label>
              <input
                type="text"
                placeholder="Plot No. 48/B, Phase-II, Industrial Estate, Ambattur, Chennai - 600058"
                value={formData.buyerSnapshot?.billingAddress?.street || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  buyerSnapshot: {
                    ...(formData.buyerSnapshot || {}),
                    billingAddress: { ...(formData.buyerSnapshot?.billingAddress || {}), street: e.target.value },
                    shippingAddress: { ...(formData.buyerSnapshot?.shippingAddress || {}), street: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-sky-500 bg-white transition"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">
                State & GST State Code <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.buyerSnapshot?.billingAddress?.stateCode || '33'}
                onChange={(e) => {
                  const code = e.target.value;
                  const matchedState = INDIAN_STATES.find(s => s.code === code);
                  const stateName = matchedState ? matchedState.name : 'Tamil Nadu';
                  const isInter = String(code).trim() !== String(settings?.address?.stateCode || '33').trim();

                  setFormData(prev => ({
                    ...prev,
                    isInterstate: isInter,
                    buyerSnapshot: {
                      ...(prev.buyerSnapshot || {}),
                      billingAddress: {
                        ...(prev.buyerSnapshot?.billingAddress || {}),
                        state: stateName,
                        stateCode: code
                      },
                      shippingAddress: {
                        ...(prev.buyerSnapshot?.shippingAddress || {}),
                        state: stateName,
                        stateCode: code
                      }
                    }
                  }));
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500 bg-slate-50/70 transition"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interstate Tax Mode Status Banner */}
          <div className={`p-2.5 rounded-xl text-xs flex items-center justify-between ${
            formData.isInterstate
              ? 'bg-amber-50/90 border border-amber-200 text-amber-900'
              : 'bg-emerald-50/90 border border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                Applied Tax Regime: <strong>{formData.isInterstate ? 'Inter-State (IGST 18%)' : 'Intra-State (CGST 9% + SGST 9%)'}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isInterstate: !prev.isInterstate }))}
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-white border border-current hover:bg-slate-50 transition"
            >
              Toggle Regime
            </button>
          </div>

          {/* Step 2 Navigation Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Invoice Details</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-xs transition active:scale-[0.98]"
            >
              <span>Next: Testing Services</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DYNAMIC TESTING SERVICES BUILDER */}
      {currentStep === 3 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-3.5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs">
                <Calculator className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                3. Testing Services & Line Items
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
              {formData.items.length} {formData.items.length === 1 ? 'service item' : 'service items'}
            </span>
          </div>

          {/* Line items list */}
          <div className="space-y-3">
            {formData.items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5 transition"
              >
                {/* Row 1: Line Item Header & Service Template Picker */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-5 h-5 rounded bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    {services && services.length > 0 && (
                      <select
                        value={item.serviceId || ''}
                        onChange={(e) => handleSelectServiceForIndex(e.target.value, idx)}
                        className="w-full max-w-sm px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="">-- Choose testing catalog template --</option>
                        {services.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name} ({formatINR(s.defaultRate)} / {s.unit})
                          </option>
                        ))}
                      </select>
                    )}
                    <span className="text-xs font-semibold text-slate-700 hidden sm:inline">Item #{idx + 1}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Tested Date & Day Type in Row 1 */}
                    <input
                      type="date"
                      title="Tested On Date"
                      value={item.testedDate || ''}
                      onChange={(e) => handleItemChange(idx, 'testedDate', e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white"
                    />
                    <select
                      value={item.dayType || ''}
                      onChange={(e) => handleItemChange(idx, 'dayType', e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 bg-white"
                    >
                      <option value="">Day/Visit</option>
                      <option value="Half Day">Half Day</option>
                      <option value="Full Day">Full Day</option>
                      <option value="Minimum Visit">Min Visit</option>
                      <option value="1 Day">1 Day</option>
                      <option value="2 Days">2 Days</option>
                    </select>

                    <button
                      type="button"
                      title="Duplicate Row"
                      onClick={() => duplicateItemRow(idx)}
                      className="p-1 text-slate-500 hover:text-sky-600 hover:bg-slate-200 rounded transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Remove Row"
                      onClick={() => removeItemRow(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Description & Pricing Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  {/* Description */}
                  <div className="sm:col-span-6 space-y-0.5">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">
                      Service Description / Sample Exam <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PMI TESTING CHARGES (SS316L Forged Flanges)"
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-sky-500 transition"
                    />
                  </div>

                  {/* HSN/SAC */}
                  <div className="sm:col-span-1 space-y-0.5">
                    <label className="block text-[10px] font-semibold text-slate-600 text-center">HSN</label>
                    <input
                      type="text"
                      value={item.hsnSac || '998346'}
                      onChange={(e) => handleItemChange(idx, 'hsnSac', e.target.value)}
                      className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-center text-slate-800 bg-white"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-1 space-y-0.5">
                    <label className="block text-[10px] font-bold text-slate-700 text-center">Qty *</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={item.quantity ?? 1}
                      onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                      className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-900 bg-white focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {/* Rate */}
                  <div className="sm:col-span-2 space-y-0.5">
                    <label className="block text-[10px] font-bold text-slate-700 text-right">Rate (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={item.rate ?? 0}
                      onChange={(e) => handleItemChange(idx, 'rate', Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right text-slate-900 bg-white focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {/* Taxable Total */}
                  <div className="sm:col-span-2 space-y-0.5">
                    <label className="block text-[10px] font-bold text-slate-800 text-right">Taxable (₹)</label>
                    <div className="px-2.5 py-1.5 bg-slate-200/80 border border-slate-300 rounded-lg text-xs font-mono font-extrabold text-slate-900 text-right">
                      {formatINR((Number(item.quantity) || 0) * (Number(item.rate) || 0))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Service CTA & Quick Subtotal Strip */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={addItemRow}
              className="py-2 px-4 border border-dashed border-sky-400 hover:border-sky-500 bg-sky-50 hover:bg-sky-100/70 text-sky-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Service Line Item</span>
            </button>

            <div className="text-right text-xs">
              <span className="text-slate-500">Total Taxable: </span>
              <strong className="font-mono font-bold text-slate-900 text-sm">{formatINR(calculatedMath.taxableTotal)}</strong>
            </div>
          </div>

          {/* Step 3 Navigation Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back: Buyer Info</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-xs transition active:scale-[0.98]"
            >
              <span>Next: Tax & Finalize</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: TAXATION & TOTALS BREAKDOWN */}
      {currentStep === 4 && (
        <div className="space-y-3.5 animate-fade-in">
          {/* Review Summary Pill */}
          <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Invoice Details Summary
              </span>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-[11px] text-sky-600 hover:underline font-semibold"
              >
                Edit Details
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Invoice No & Date</span>
                <span className="font-mono font-bold text-slate-800">{formData.invoiceNumber}</span>
                <span className="text-slate-500 block text-[10px]">{formData.invoiceDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Buyer / Customer</span>
                <span className="font-semibold text-slate-900 truncate block">{formData.buyerSnapshot?.companyName}</span>
                <span className="text-slate-500 font-mono text-[10px]">GST: {formData.buyerSnapshot?.gstin || 'Unregistered'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Testing Items</span>
                <span className="font-bold text-slate-800">{formData.items.length} Line Items</span>
                <span className="text-slate-500 text-[10px]">State: {formData.buyerSnapshot?.billingAddress?.state}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Tax Regime</span>
                <span className="font-bold text-emerald-700">
                  {formData.isInterstate ? 'IGST (18%)' : 'CGST (9%) + SGST (9%)'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                <Calculator className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                4. Tax Calculation & Grand Total Breakdown
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {/* Left Column: Amount in Words & Notes */}
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Amount Chargeable (in words)
                  </span>
                  <p className="text-xs font-bold text-slate-900 leading-snug">
                    {convertNumberToWords(calculatedMath.grandTotal)}
                  </p>
                </div>

                <div className="p-3 bg-sky-50/80 rounded-xl border border-sky-200 text-sky-900 text-xs flex items-center justify-between">
                  <span className="font-medium">Applied GST Regime:</span>
                  <span className="font-bold">
                    {formData.isInterstate ? 'Inter-State (IGST 18%)' : 'Intra-State (CGST 9% + SGST 9%)'}
                  </span>
                </div>
              </div>

              {/* Right Column: Computed Numbers Table */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Amount:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatINR(calculatedMath.subtotal)}</span>
                </div>

                {calculatedMath.discountTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span className="font-mono text-rose-600">-{formatINR(calculatedMath.discountTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Taxable Value:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatINR(calculatedMath.taxableTotal)}</span>
                </div>

                {!formData.isInterstate ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST (9%):</span>
                      <span className="font-mono font-semibold text-slate-900">{formatINR(calculatedMath.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST (9%):</span>
                      <span className="font-mono font-semibold text-slate-900">{formatINR(calculatedMath.sgstAmount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST (18%):</span>
                    <span className="font-mono font-semibold text-slate-900">{formatINR(calculatedMath.igstAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                  <span>Round Off:</span>
                  <span className="font-mono font-medium text-slate-700">{Number(calculatedMath.roundOff || 0).toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300 font-bold text-sm text-slate-950">
                  <span className="uppercase">Grand Total (₹):</span>
                  <span className="font-mono text-base text-sky-700 font-extrabold">{formatINR(calculatedMath.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Step 4 Navigation / Final Submission Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back: Testing Services</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit('Draft')}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 transition disabled:opacity-50"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSubmit('Generated')}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition active:scale-[0.98] disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Processing...' : isEdit ? 'Update Invoice' : 'Generate & Finalize'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick New Customer Modal */}
      {showNewCustomerModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-fade-in no-print">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs flex flex-col max-h-[90vh] animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Quick Register Buyer</h3>
                  <p className="text-[11px] text-slate-500">Add a new customer to select on this invoice</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewCustomerModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuickCustomer} className="flex flex-col flex-1 min-h-0">
              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Company / Buyer Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Godrej Aerospace"
                    value={newCustForm.companyName || ''}
                    onChange={(e) => setNewCustForm({ ...newCustForm, companyName: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">GSTIN / UIN</label>
                    <input
                      type="text"
                      placeholder="e.g. 33AAACG9999K1Z2"
                      value={newCustForm.gstin || ''}
                      onChange={(e) => {
                        const gstin = e.target.value.toUpperCase();
                        const code = gstin.substring(0, 2);
                        const matched = INDIAN_STATES.find(s => s.code === code);
                        setNewCustForm(prev => ({
                          ...prev,
                          gstin,
                          stateCode: code || prev.stateCode,
                          state: matched ? matched.name : prev.state
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs font-bold uppercase text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">State Code</label>
                    <select
                      value={newCustForm.stateCode || '33'}
                      onChange={(e) => {
                        const code = e.target.value;
                        const matched = INDIAN_STATES.find(s => s.code === code);
                        setNewCustForm({
                          ...newCustForm,
                          stateCode: code,
                          state: matched ? matched.name : 'Tamil Nadu'
                        });
                      }}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st.code} value={st.code}>
                          {st.name} ({st.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. Sharma"
                      value={newCustForm.contactPerson || ''}
                      onChange={(e) => setNewCustForm({ ...newCustForm, contactPerson: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98401 23456"
                      value={newCustForm.phone || ''}
                      onChange={(e) => setNewCustForm({ ...newCustForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Buyer Address</label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Industrial Complex Phase 1, Ambattur, Chennai - 600058"
                    value={newCustForm.street || ''}
                    onChange={(e) => setNewCustForm({ ...newCustForm, street: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                  ></textarea>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/90 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl border border-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition active:scale-[0.98]"
                >
                  Register Customer
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
