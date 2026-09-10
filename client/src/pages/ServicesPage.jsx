import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FlaskConical,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Tag,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Layers,
  Plus,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

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

export default function ServicesPage() {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);

  const defaultRow = () => ({
    name: '',
    category: 'NDT',
    hsnSac: '998346',
    defaultRate: '',
    unit: 'No.',
    taxRate: 18
  });

  const [bulkRows, setBulkRows] = useState([
    defaultRow(),
    defaultRow(),
    defaultRow()
  ]);

  const [formData, setFormData] = useState({
    serviceCode: '',
    name: '',
    description: '',
    hsnSac: '998346',
    defaultRate: 0,
    unit: 'No.',
    category: 'NDT',
    taxRate: 18
  });

  const categories = ['All', 'NDT', 'Chemical', 'Mechanical', 'Metallography', 'Corrosion', 'Other'];

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.getServices({ search: searchQuery, category: categoryFilter });
      if (res.success && res.data) {
        setServices(res.data);
      }
    } catch (e) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [searchQuery, categoryFilter]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      serviceCode: `TEST-${Date.now().toString().slice(-4)}`,
      name: '',
      description: '',
      hsnSac: '998346',
      defaultRate: 1500,
      unit: 'No.',
      category: 'NDT',
      taxRate: 18
    });
    setShowModal(true);
  };

  const handleOpenBulkCreate = () => {
    setBulkRows([defaultRow(), defaultRow(), defaultRow()]);
    setShowBulkModal(true);
  };

  const handleAddBulkRow = (count = 1) => {
    const newRows = Array.from({ length: count }, () => defaultRow());
    setBulkRows((prev) => [...prev, ...newRows]);
  };

  const handleRemoveBulkRow = (index) => {
    if (bulkRows.length <= 1) {
      setBulkRows([defaultRow()]);
      return;
    }
    setBulkRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBulkRowChange = (index, field, value) => {
    setBulkRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleLoadPresetsInBulk = () => {
    setBulkRows(STANDARD_PRESETS.map(p => ({ ...p })));
    toast.success('Loaded 10 standard testing presets!');
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const validRows = bulkRows
      .filter((r) => r.name && r.name.trim() !== '')
      .map((r) => ({
        name: r.name.trim(),
        category: r.category || 'NDT',
        hsnSac: r.hsnSac || '998346',
        defaultRate: Number(r.defaultRate) || 0,
        unit: r.unit || 'No.',
        taxRate: Number(r.taxRate) || 18
      }));

    if (validRows.length === 0) {
      toast.error('Please fill at least one service name and rate');
      return;
    }

    try {
      setSavingBulk(true);
      const res = await api.createMultipleServices(validRows);
      if (res.success) {
        toast.success(`Successfully added ${res.count || validRows.length} services to catalog!`);
        setShowBulkModal(false);
        fetchServices();
      } else {
        toast.error(res.message || 'Failed to save services');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save services');
    } finally {
      setSavingBulk(false);
    }
  };

  const handleOpenEdit = (srv) => {
    setIsEditing(true);
    setFormData({
      _id: srv._id,
      serviceCode: srv.serviceCode,
      name: srv.name,
      description: srv.description || '',
      hsnSac: srv.hsnSac || '998346',
      defaultRate: srv.defaultRate || 0,
      unit: srv.unit || 'No.',
      category: srv.category || 'NDT',
      taxRate: srv.taxRate || 18
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Service Name is required');
      return;
    }

    try {
      if (isEditing) {
        const res = await api.updateService(formData._id, formData);
        if (res.success) {
          toast.success(`Updated ${formData.name}`);
          setShowModal(false);
          fetchServices();
        }
      } else {
        const res = await api.createService(formData);
        if (res.success) {
          toast.success(`Created ${formData.name}`);
          setShowModal(false);
          fetchServices();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save service');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete testing service "${name}"?`)) {
      try {
        const res = await api.deleteService(id);
        if (res.success) {
          toast.success('Service removed from catalog');
          fetchServices();
        }
      } catch (e) {
        toast.error('Failed to delete service');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Testing Catalog Master</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard laboratory testing services, HSN/SAC codes, and default fee schedules
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenBulkCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs rounded-lg border border-sky-200 shadow-2xs transition"
          >
            <Layers className="w-4 h-4 text-sky-600" />
            <span>+ Add Multiple Services</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-sm transition active:scale-[0.98] border border-sky-400/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Single Service</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Category Tabs */}
        <div className="border-b border-slate-200 px-4 bg-slate-50/70 flex items-center gap-1 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3.5 py-3 text-xs font-semibold whitespace-nowrap transition border-b-2 ${
                categoryFilter === cat
                  ? 'border-sky-600 text-sky-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {cat === 'All' ? 'All Testing Disciplines' : cat}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by test name, code, or HSN/SAC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 bg-white"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {services.length} active service items
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Testing Service Description</th>
                <th className="py-3 px-3 text-center">Category</th>
                <th className="py-3 px-3 text-center">HSN/SAC</th>
                <th className="py-3 px-3 text-right">Default Rate (₹)</th>
                <th className="py-3 px-3 text-center">Billing Unit</th>
                <th className="py-3 px-3 text-center">GST Rate</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.length > 0 ? (
                services.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">
                      {s.serviceCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500 max-w-md line-clamp-1">{s.description || '—'}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {s.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700 font-semibold">
                      {s.hsnSac || '998346'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(s.defaultRate)}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-700 font-medium">
                      {s.unit || 'No.'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {s.taxRate || 18}%
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Edit Service"
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s._id, s.name)}
                          title="Delete Service"
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
                    No services found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {isEditing ? 'Edit Testing Service' : 'Add New Testing Service'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.serviceCode}
                    onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-900 uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-900 bg-slate-50"
                  >
                    <option value="NDT">NDT (Non-Destructive)</option>
                    <option value="Chemical">Chemical (Spectro / Wet)</option>
                    <option value="Mechanical">Mechanical (Tensile/Impact/Hardness)</option>
                    <option value="Metallography">Metallography / Microstructure</option>
                    <option value="Corrosion">Corrosion (Salt Spray / IGC)</option>
                    <option value="Other">Other Testing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Testing Service Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PMI Testing Charges (Positive Material Identification)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1">Detailed Technical Description</label>
                <textarea
                  rows="2"
                  placeholder="e.g. XRF examination of Cr, Ni, Mo alloy composition with test certificate."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HSN / SAC</label>
                  <input
                    type="text"
                    required
                    value={formData.hsnSac}
                    onChange={(e) => setFormData({ ...formData, hsnSac: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-center text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Default Rate (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.defaultRate}
                    onChange={(e) => setFormData({ ...formData, defaultRate: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-right text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="No. / Sample"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-center text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow-xs transition"
                >
                  {isEditing ? 'Save Service' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Add Multiple Services Modal */}
      {showBulkModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Add Multiple Testing Services in Bulk
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Quickly add multiple test methods, pricing, and HSN codes to your catalog at once.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadPresetsInBulk}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 font-semibold text-xs rounded-lg transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Load 10 Standard Presets</span>
                </button>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content / Table */}
            <form onSubmit={handleBulkSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-700">
                    Service Rows ({bulkRows.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddBulkRow(1)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs border border-slate-300 rounded-md transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-600" />
                      <span>+ 1 Row</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBulkRow(3)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs border border-slate-300 rounded-md transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-600" />
                      <span>+ 3 Rows</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-2.5 px-3 w-8 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[220px]">Testing Service Name *</th>
                        <th className="py-2.5 px-3 w-32">Category</th>
                        <th className="py-2.5 px-3 w-24 text-center">HSN/SAC</th>
                        <th className="py-2.5 px-3 w-28 text-right">Default Rate (₹) *</th>
                        <th className="py-2.5 px-3 w-24 text-center">Unit</th>
                        <th className="py-2.5 px-3 w-20 text-center">GST %</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono font-bold">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              required
                              placeholder="e.g. PMI Testing Charges"
                              value={row.name}
                              onChange={(e) => handleBulkRowChange(idx, 'name', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={row.category}
                              onChange={(e) => handleBulkRowChange(idx, 'category', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-slate-800 bg-slate-50"
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
                              onChange={(e) => handleBulkRowChange(idx, 'hsnSac', e.target.value)}
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
                              onChange={(e) => handleBulkRowChange(idx, 'defaultRate', e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono font-bold text-right text-slate-900 bg-white focus:ring-2 focus:ring-sky-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="No."
                              value={row.unit}
                              onChange={(e) => handleBulkRowChange(idx, 'unit', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-center text-slate-800 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={row.taxRate}
                              onChange={(e) => handleBulkRowChange(idx, 'taxRate', Number(e.target.value))}
                              className="w-full px-1.5 py-1.5 border border-slate-300 rounded-md font-mono text-center text-slate-800 bg-slate-50"
                            >
                              <option value={18}>18%</option>
                              <option value={12}>12%</option>
                              <option value={5}>5%</option>
                              <option value={0}>0%</option>
                            </select>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveBulkRow(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => handleAddBulkRow(1)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-600" />
                  <span>+ Add Another Row</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingBulk}
                    className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow-sm transition active:scale-[0.98] disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-sky-200" />
                    <span>
                      {savingBulk
                        ? 'Saving Services...'
                        : `Save All ${bulkRows.filter(r => r.name.trim()).length || bulkRows.length} Services`}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
