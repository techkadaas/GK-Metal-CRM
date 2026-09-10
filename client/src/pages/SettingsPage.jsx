import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  FileText,
  Percent,
  CreditCard,
  PenTool,
  Save,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  FlaskConical,
  Plus,
  PlusCircle,
  Trash2,
  Sparkles,
  Search,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { INDIAN_STATES } from '../utils/taxCalculator';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';

const STANDARD_PRESETS = [
  { name: 'PMI Testing Charges (Positive Material Identification)', category: 'NDT', hsnSac: '998346', defaultRate: 2500, unit: 'No.', taxRate: 18, description: 'XRF Chemical PMI verification' },
  { name: 'Ultrasonic Flaw Detection Testing (UT)', category: 'NDT', hsnSac: '998346', defaultRate: 1800, unit: 'Joint', taxRate: 18, description: 'Ultrasonic inspection for internal flaws' },
  { name: 'Liquid / Dye Penetrant Testing (DPT / PT)', category: 'NDT', hsnSac: '998346', defaultRate: 950, unit: 'Sample', taxRate: 18, description: 'Surface flaw detection using visible solvent penetrant' },
  { name: 'Magnetic Particle Inspection (MPI / MPT)', category: 'NDT', hsnSac: '998346', defaultRate: 1200, unit: 'Sample', taxRate: 18, description: 'Electromagnetic yoke magnetic particle testing' },
  { name: 'Radiography Testing (RT) Examination', category: 'NDT', hsnSac: '998346', defaultRate: 2200, unit: 'Film', taxRate: 18, description: 'Industrial gamma/x-ray radiography testing' },
  { name: 'Chemical Spectro Analysis (OES)', category: 'Chemical', hsnSac: '998346', defaultRate: 1500, unit: 'Sample', taxRate: 18, description: 'Optical emission spectroscopy elemental composition' },
  { name: 'Tensile & Yield Strength with % Elongation', category: 'Mechanical', hsnSac: '998346', defaultRate: 1400, unit: 'Sample', taxRate: 18, description: 'Universal testing machine tension test per ASTM' },
  { name: 'Charpy V-Notch Impact Test (3 Specimens)', category: 'Mechanical', hsnSac: '998346', defaultRate: 1600, unit: 'Set of 3', taxRate: 18, description: 'Impact toughness test at ambient or sub-zero temp' },
  { name: 'Hardness Test (Rockwell / Brinell / Vickers)', category: 'Mechanical', hsnSac: '998346', defaultRate: 600, unit: 'Location', taxRate: 18, description: 'Multi-point hardness indentation test' },
  { name: 'Microstructure & Grain Size Examination', category: 'Metallography', hsnSac: '998346', defaultRate: 1800, unit: 'Sample', taxRate: 18, description: 'Polishing, etching, and optical microscopic analysis' }
];

export default function SettingsPage() {
  const { settings, updateSettings, loading, reloadSettings } = useSettings();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Services Catalog Tab State
  const defaultRow = () => ({
    name: '',
    category: 'NDT',
    hsnSac: '998346',
    defaultRate: '',
    unit: 'No.',
    taxRate: 18,
    description: ''
  });

  const [serviceRows, setServiceRows] = useState([
    defaultRow(),
    defaultRow(),
    defaultRow()
  ]);
  const [servicesList, setServicesList] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');

  const fetchServicesList = async () => {
    try {
      setLoadingServices(true);
      const res = await api.getServices();
      if (res.success && res.data) {
        setServicesList(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'services') {
      fetchServicesList();
    }
  }, [activeTab]);

  useEffect(() => {
    if (settings) {
      setFormData(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings]);

  const handleAddServiceRow = () => {
    setServiceRows((prev) => [
      ...prev,
      {
        ...defaultRow(),
        hsnSac: formData?.taxConfig?.hsnSacDefault || '998346'
      }
    ]);
  };

  const handleAddMultipleEmptyRows = (count = 3) => {
    const newRows = Array.from({ length: count }, () => ({
      ...defaultRow(),
      hsnSac: formData?.taxConfig?.hsnSacDefault || '998346'
    }));
    setServiceRows((prev) => [...prev, ...newRows]);
  };

  const handleRemoveServiceRow = (index) => {
    if (serviceRows.length <= 1) {
      setServiceRows([defaultRow()]);
      return;
    }
    setServiceRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleServiceRowChange = (index, field, value) => {
    setServiceRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleLoadStandardPresets = () => {
    setServiceRows(STANDARD_PRESETS.map(p => ({ ...p })));
    toast.success('Loaded 10 standard testing service presets!');
  };

  const handleSaveMultipleServices = async () => {
    const validRows = serviceRows
      .filter((r) => r.name && r.name.trim() !== '')
      .map((r) => ({
        name: r.name.trim(),
        category: r.category || 'NDT',
        hsnSac: r.hsnSac || formData?.taxConfig?.hsnSacDefault || '998346',
        defaultRate: Number(r.defaultRate) || 0,
        unit: r.unit || 'No.',
        taxRate: Number(r.taxRate) || 18,
        description: r.description || ''
      }));

    if (validRows.length === 0) {
      toast.error('Please enter at least one service name and rate');
      return;
    }

    try {
      setSavingServices(true);
      const res = await api.createMultipleServices(validRows);
      if (res.success) {
        toast.success(`Successfully added ${res.count || validRows.length} services to the catalog!`);
        setServiceRows([defaultRow(), defaultRow()]);
        fetchServicesList();
      } else {
        toast.error(res.message || 'Failed to save services');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save services');
    } finally {
      setSavingServices(false);
    }
  };

  const handleDeleteExistingService = async (id, name) => {
    if (window.confirm(`Delete service "${name}" from catalog?`)) {
      try {
        const res = await api.deleteService(id);
        if (res.success) {
          toast.success(`Deleted ${name}`);
          fetchServicesList();
        }
      } catch (err) {
        toast.error('Failed to delete service');
      }
    }
  };

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500">Loading company settings...</p>
        </div>
      </div>
    );
  }

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      setSaving(true);
      const res = await updateSettings(formData);
      if (res.success) {
        toast.success('Lab & Invoicing Settings saved successfully!');
      } else {
        toast.error(res.message || 'Failed to update settings');
      }
    } catch (err) {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Company Profile & NABL', icon: Building2 },
    { id: 'services', label: 'Testing Services Catalog', icon: FlaskConical },
    { id: 'invoice', label: 'Invoice Sequences', icon: FileText },
    { id: 'tax', label: 'Tax & GST Rates', icon: Percent },
    { id: 'bank', label: 'Bank Accounts', icon: CreditCard },
    { id: 'terms', label: 'Terms & Signatory', icon: PenTool }
  ];

  const filteredExistingServices = servicesList.filter((s) => {
    if (!serviceSearch.trim()) return true;
    const q = serviceSearch.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.serviceCode?.toLowerCase().includes(q) ||
      s.hsnSac?.includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure laboratory branding, GST sequences, bank accounts, and invoice templates
          </p>
        </div>

        {activeTab !== 'services' && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-sm transition active:scale-[0.98] disabled:opacity-50 border border-sky-400/30"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        )}
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tabs Bar */}
        <div className="border-b border-slate-200 px-4 bg-slate-50 flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition border-b-2 ${
                  isActive
                    ? 'border-sky-600 text-sky-700 bg-white font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <form onSubmit={handleSave} className="p-6 space-y-6 text-xs">
          {/* TAB 1: GENERAL COMPANY INFO */}
          {activeTab === 'general' && (
            <div className="space-y-4 max-w-3xl animate-fade-in">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                Laboratory Business Header Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company / Lab Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tagline / Accreditation Subtitle</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN *</label>
                  <input
                    type="text"
                    required
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PAN Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NABL Accreditation Ref</label>
                  <input
                    type="text"
                    value={formData.nablAccreditationNo}
                    onChange={(e) => setFormData({ ...formData, nablAccreditationNo: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone(s)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3 pt-2">
                <span className="font-bold text-slate-800 block">Registered Lab Address</span>

                <div>
                  <label className="block text-slate-600 mb-1">Street / Industrial Estate</label>
                  <input
                    type="text"
                    value={formData.address?.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.address?.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">State & Code</label>
                    <select
                      value={formData.address?.stateCode || '33'}
                      onChange={(e) => {
                        const code = e.target.value;
                        const st = INDIAN_STATES.find(s => s.code === code);
                        setFormData({
                          ...formData,
                          address: {
                            ...formData.address,
                            stateCode: code,
                            state: st ? st.name : 'Tamil Nadu'
                          }
                        });
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-900 bg-slate-50"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={formData.address?.pincode}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, pincode: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TESTING SERVICES & BULK MULTIPLE SERVICES ADDITION */}
          {activeTab === 'services' && (
            <div className="space-y-6 animate-fade-in">
              {/* Top Banner & Quick Controls */}
              <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white p-5 rounded-xl border border-sky-800/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-sky-400" />
                    <h3 className="font-bold text-base text-white">Add Multiple Testing Services</h3>
                  </div>
                  <p className="text-xs text-sky-200/80 max-w-xl">
                    Define and bulk-register multiple testing items, NDT procedures, chemical spectro tests, or mechanical hardness rates to your laboratory master catalog in one step.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadStandardPresets}
                    className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-semibold text-xs rounded-lg border border-sky-400/30 transition shadow-xs"
                    title="Populate with 10 standard metallurgical & NDT test services"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Load 10 Standard Presets</span>
                  </button>
                </div>
              </div>

              {/* Bulk Multi-Row Entry Table */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <Layers className="w-4 h-4 text-sky-600" />
                      <span>Multiple Services Entry Form ({serviceRows.length} {serviceRows.length === 1 ? 'row' : 'rows'})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Fill out each row below. Click "+ Add Row" or "+ Add 3 Rows" to add as many services as you need.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddServiceRow}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 rounded-lg shadow-2xs transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-600" />
                      <span>+ 1 Row</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddMultipleEmptyRows(3)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 rounded-lg shadow-2xs transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-600" />
                      <span>+ 3 Rows</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceRows([defaultRow(), defaultRow()])}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs rounded-lg transition"
                    >
                      Reset Rows
                    </button>
                  </div>
                </div>

                {/* Table of Rows */}
                <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[240px]">Testing Service Name *</th>
                        <th className="py-2.5 px-3 w-36">Category</th>
                        <th className="py-2.5 px-3 w-28 text-center">HSN/SAC</th>
                        <th className="py-2.5 px-3 w-32 text-right">Default Rate (₹) *</th>
                        <th className="py-2.5 px-3 w-28 text-center">Billing Unit</th>
                        <th className="py-2.5 px-3 w-24 text-center">GST %</th>
                        <th className="py-2.5 px-3 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {serviceRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-sky-50/30 transition">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              required
                              placeholder={`e.g. ${idx === 0 ? 'PMI Testing Charges' : idx === 1 ? 'Ultrasonic Flaw Test' : 'Tensile & Yield Test'}`}
                              value={row.name}
                              onChange={(e) => handleServiceRowChange(idx, 'name', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={row.category}
                              onChange={(e) => handleServiceRowChange(idx, 'category', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-medium text-slate-800 bg-slate-50 focus:bg-white"
                            >
                              <option value="NDT">NDT</option>
                              <option value="Chemical">Chemical</option>
                              <option value="Mechanical">Mechanical</option>
                              <option value="Metallography">Metallography</option>
                              <option value="Corrosion">Corrosion</option>
                              <option value="Other">Other</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.hsnSac}
                              onChange={(e) => handleServiceRowChange(idx, 'hsnSac', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono text-center text-slate-800 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required
                              placeholder="0.00"
                              value={row.defaultRate}
                              onChange={(e) => handleServiceRowChange(idx, 'defaultRate', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono font-bold text-right text-slate-900 bg-white focus:ring-2 focus:ring-sky-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="No. / Sample"
                              value={row.unit}
                              onChange={(e) => handleServiceRowChange(idx, 'unit', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-center text-slate-800 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={row.taxRate}
                              onChange={(e) => handleServiceRowChange(idx, 'taxRate', Number(e.target.value))}
                              className="w-full px-1.5 py-1.5 border border-slate-300 rounded-md font-mono text-center text-slate-800 bg-slate-50"
                            >
                              <option value={18}>18%</option>
                              <option value={12}>12%</option>
                              <option value={5}>5%</option>
                              <option value={0}>0%</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveServiceRow(idx)}
                              title="Remove Row"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bulk Save & Row Adder Bottom Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddServiceRow}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
                    >
                      <Plus className="w-4 h-4 text-sky-600" />
                      <span>+ Add Another Service Row</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveMultipleServices}
                    disabled={savingServices}
                    className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-sm transition active:scale-[0.98] disabled:opacity-50 border border-sky-400/30"
                  >
                    <CheckCircle2 className="w-4 h-4 text-sky-200" />
                    <span>
                      {savingServices
                        ? 'Saving Services...'
                        : `Save All ${serviceRows.filter((r) => r.name.trim()).length || serviceRows.length} Services to Catalog`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Existing Services in Catalog Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-sky-600" />
                      <span>Existing Testing Catalog ({servicesList.length} Active Services)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      All laboratory testing services currently registered in your system.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative max-w-xs">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Search existing services..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-600 font-bold z-10">
                      <tr>
                        <th className="py-2.5 px-4">Code</th>
                        <th className="py-2.5 px-4">Service Name</th>
                        <th className="py-2.5 px-3 text-center">Category</th>
                        <th className="py-2.5 px-3 text-center">HSN/SAC</th>
                        <th className="py-2.5 px-3 text-right">Default Rate (₹)</th>
                        <th className="py-2.5 px-3 text-center">Unit</th>
                        <th className="py-2.5 px-3 text-center">GST</th>
                        <th className="py-2.5 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingServices ? (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-slate-400">
                            Loading catalog services...
                          </td>
                        </tr>
                      ) : filteredExistingServices.length > 0 ? (
                        filteredExistingServices.map((srv) => (
                          <tr key={srv._id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-4 font-mono font-bold text-sky-700">
                              {srv.serviceCode}
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="font-bold text-slate-900">{srv.name}</div>
                              {srv.description && (
                                <div className="text-[10px] text-slate-400 max-w-md truncate">
                                  {srv.description}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {srv.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                              {srv.hsnSac || '998346'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {formatINR(srv.defaultRate)}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-700">
                              {srv.unit || 'No.'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                              {srv.taxRate || 18}%
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteExistingService(srv._id, srv.name)}
                                title="Delete Service"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-slate-400">
                            {servicesList.length === 0
                              ? 'No testing services in catalog yet. Use the bulk form above to add services!'
                              : 'No services match your search filter.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVOICE CONFIGURATION */}
          {activeTab === 'invoice' && (
            <div className="space-y-4 max-w-3xl animate-fade-in">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                Automatic Invoice Sequence & Numbering Rules
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={formData.invoiceConfig?.prefix}
                    onChange={(e) => setFormData({
                      ...formData,
                      invoiceConfig: { ...formData.invoiceConfig, prefix: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">e.g. GK/INV/</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Financial Year Format</label>
                  <input
                    type="text"
                    value={formData.invoiceConfig?.financialYear}
                    onChange={(e) => setFormData({
                      ...formData,
                      invoiceConfig: { ...formData.invoiceConfig, financialYear: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">e.g. 26-27</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Sequence Number</label>
                  <input
                    type="number"
                    value={formData.invoiceConfig?.currentSequence}
                    onChange={(e) => setFormData({
                      ...formData,
                      invoiceConfig: { ...formData.invoiceConfig, currentSequence: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">Auto increments</span>
                </div>
              </div>

              {/* Sample Preview */}
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg flex items-center justify-between text-xs">
                <span className="text-sky-900 font-semibold">Generated Invoice Sample Format:</span>
                <span className="font-mono font-extrabold text-sm text-sky-800">
                  {formData.invoiceConfig?.prefix}{formData.invoiceConfig?.financialYear}/{String((formData.invoiceConfig?.currentSequence || 66) + 1).padStart(3, '0')}
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: TAX RATES */}
          {activeTab === 'tax' && (
            <div className="space-y-4 max-w-3xl animate-fade-in">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                Standard GST Rates & Tax Rules
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default CGST Rate (%)</label>
                  <input
                    type="number"
                    value={formData.taxConfig?.defaultCgstRate}
                    onChange={(e) => setFormData({
                      ...formData,
                      taxConfig: { ...formData.taxConfig, defaultCgstRate: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-center font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default SGST Rate (%)</label>
                  <input
                    type="number"
                    value={formData.taxConfig?.defaultSgstRate}
                    onChange={(e) => setFormData({
                      ...formData,
                      taxConfig: { ...formData.taxConfig, defaultSgstRate: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-center font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default IGST Rate (%)</label>
                  <input
                    type="number"
                    value={formData.taxConfig?.defaultIgstRate}
                    onChange={(e) => setFormData({
                      ...formData,
                      taxConfig: { ...formData.taxConfig, defaultIgstRate: Number(e.target.value) }
                    })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-center font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Laboratory HSN/SAC Code</label>
                <input
                  type="text"
                  value={formData.taxConfig?.hsnSacDefault}
                  onChange={(e) => setFormData({
                    ...formData,
                    taxConfig: { ...formData.taxConfig, hsnSacDefault: e.target.value }
                  })}
                  className="w-full max-w-xs px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  998346: Technical testing and analysis services (Indian GST Standard for Labs)
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: BANK DETAILS */}
          {activeTab === 'bank' && (
            <div className="space-y-4 max-w-3xl animate-fade-in">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                Settlement Bank Account Details (Printed on Invoices)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.bankDetails?.bankName}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Beneficiary Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.bankDetails?.accountName}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accountName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Account Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.bankDetails?.accountNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.bankDetails?.ifscCode}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, ifscCode: e.target.value.toUpperCase() }
                    })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bank Branch</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.branch}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, branch: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={formData.bankDetails?.upiId}
                    onChange={(e) => setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, upiId: e.target.value }
                    })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TERMS & SIGNATORY */}
          {activeTab === 'terms' && (
            <div className="space-y-4 max-w-3xl animate-fade-in">
              <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
                Default Terms, Declarations & Signatory
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Authorized Signatory Name</label>
                  <input
                    type="text"
                    value={formData.invoiceConfig?.authorizedSignatoryName}
                    onChange={(e) => setFormData({
                      ...formData,
                      invoiceConfig: { ...formData.invoiceConfig, authorizedSignatoryName: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Signatory Title</label>
                  <input
                    type="text"
                    value={formData.invoiceConfig?.signatoryTitle}
                    onChange={(e) => setFormData({
                      ...formData,
                      invoiceConfig: { ...formData.invoiceConfig, signatoryTitle: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Statutory Declaration</label>
                <textarea
                  rows="2"
                  value={formData.invoiceConfig?.declaration}
                  onChange={(e) => setFormData({
                    ...formData,
                    invoiceConfig: { ...formData.invoiceConfig, declaration: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Notes & Payment Conditions</label>
                <textarea
                  rows="4"
                  value={formData.invoiceConfig?.defaultNotes}
                  onChange={(e) => setFormData({
                    ...formData,
                    invoiceConfig: { ...formData.invoiceConfig, defaultNotes: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                ></textarea>
              </div>
            </div>
          )}

          {/* Form Submit Footer */}
          {activeTab !== 'services' && (
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-sm transition active:scale-[0.98] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
