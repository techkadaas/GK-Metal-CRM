import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  UserCheck,
  PlusCircle,
  Shield,
  Mail,
  Phone,
  Edit,
  Trash2,
  Building,
  CheckCircle,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const SYSTEM_PAGES = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Summary metrics & financial KPIs' },
  { id: 'invoices', label: 'Invoices', desc: 'Create, edit, view & print GST Tax Invoices' },
  { id: 'customers', label: 'Customers', desc: 'Client database & balance ledger' },
  { id: 'services', label: 'Services', desc: 'Testing charges catalog & HSN/SAC codes' },
  { id: 'reports', label: 'Report Management', desc: 'Test reports and certificates' },
  { id: 'employees', label: 'Staff & Roles (RBAC)', desc: 'Manage employees, credentials & page permissions' },
  { id: 'settings', label: 'Lab Settings', desc: 'Company profile, bank details & invoice numbering' }
];

export default function EmployeesPage() {
  const toast = useToast();
  const { currentUser, updateUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'Billing Employee',
    department: 'Accounts & Invoicing',
    password: '',
    status: 'Active',
    allowedPages: ['dashboard', 'invoices', 'customers', 'services', 'reports']
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployees();
      if (res && res.success && Array.isArray(res.data)) {
        setEmployees(res.data);
      } else if (res && Array.isArray(res.data)) {
        setEmployees(res.data);
      } else {
        setEmployees([]);
      }
    } catch (e) {
      console.error('Failed to load employees:', e);
      toast.error('Failed to load staff list');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setShowPassword(false);
    const count = Array.isArray(employees) ? employees.length : 0;
    setFormData({
      employeeId: `EMP-0${count + 1}`,
      name: '',
      username: '',
      email: '',
      phone: '',
      role: 'Billing Employee',
      department: 'Accounts & Invoicing',
      password: '',
      status: 'Active',
      allowedPages: ['dashboard', 'invoices', 'customers', 'services', 'reports']
    });
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    if (!emp) return;
    setIsEditing(true);
    setShowPassword(false);
    const emailStr = String(emp.email || '');
    setFormData({
      _id: emp._id,
      employeeId: emp.employeeId || '',
      name: emp.name || '',
      username: emp.username || (emailStr ? emailStr.split('@')[0] : '') || '',
      email: emailStr,
      phone: emp.phone || '',
      role: emp.role || 'Billing Employee',
      department: emp.department || 'Operations',
      password: '', // Blank by default when editing
      status: emp.status || 'Active',
      allowedPages: Array.isArray(emp.allowedPages) && emp.allowedPages.length > 0
        ? emp.allowedPages
        : (emp.role === 'Admin' ? SYSTEM_PAGES.map(p => p.id) : ['dashboard', 'invoices', 'customers', 'services', 'reports'])
    });
    setShowModal(true);
  };

  const togglePagePermission = (pageId) => {
    setFormData(prev => {
      const current = Array.isArray(prev.allowedPages) ? prev.allowedPages : [];
      if (current.includes(pageId)) {
        return { ...prev, allowedPages: current.filter(p => p !== pageId) };
      } else {
        return { ...prev, allowedPages: [...current, pageId] };
      }
    });
  };

  const handleSelectAllPages = () => {
    setFormData(prev => ({
      ...prev,
      allowedPages: SYSTEM_PAGES.map(p => p.id)
    }));
  };

  const handleClearAllPages = () => {
    setFormData(prev => ({
      ...prev,
      allowedPages: ['dashboard']
    }));
  };

  const handleRoleChange = (newRole) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      allowedPages: newRole === 'Admin'
        ? SYSTEM_PAGES.map(p => p.id)
        : prev.allowedPages
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Full Name and Email are required.');
      return;
    }

    if (!formData.username.trim()) {
      toast.error('Login Username is required.');
      return;
    }

    if (!isEditing && !formData.password.trim()) {
      toast.error('Password is required when registering a new staff member.');
      return;
    }

    try {
      const payload = {
        ...formData,
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase()
      };

      if (isEditing) {
        const res = await api.updateEmployee(formData._id, payload);
        if (res.success) {
          toast.success(`Updated ${formData.name} successfully!`);
          setShowModal(false);
          fetchEmployees();

          // If the logged in user updated their own record, update current Auth context
          if (currentUser && (currentUser._id === formData._id || currentUser.employeeId === formData.employeeId)) {
            updateUser({
              name: payload.name,
              username: payload.username,
              email: payload.email,
              role: payload.role,
              allowedPages: payload.allowedPages
            });
          }
        }
      } else {
        const res = await api.createEmployee(payload);
        if (res.success) {
          toast.success(`Staff member ${formData.name} registered successfully!`);
          setShowModal(false);
          fetchEmployees();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save staff credentials');
    }
  };

  const handleDelete = async (id, name, empId) => {
    if (currentUser && (currentUser._id === id || currentUser.employeeId === empId)) {
      toast.error('You cannot delete your own active administrator account.');
      return;
    }

    if (window.confirm(`Are you sure you want to remove staff member "${name}"? They will lose login access immediately.`)) {
      try {
        const res = await api.deleteEmployee(id);
        if (res.success) {
          toast.success('Staff member removed');
          fetchEmployees();
        }
      } catch (e) {
        toast.error('Failed to remove staff member');
      }
    }
  };

  const employeeList = Array.isArray(employees) ? employees : [];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff & Login Access (RBAC)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized staff members, login usernames, passwords, and module page permissions
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-sm transition active:scale-[0.98] border border-sky-400/30 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Staff Member</span>
        </button>
      </div>

      {/* Role Matrix Overview Pill */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="font-bold text-purple-700 block">Admin</span>
          <p className="text-[11px] text-slate-500 mt-1">Full control over settings, invoices, staff passwords, and tax configs</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="font-bold text-blue-700 block">Manager</span>
          <p className="text-[11px] text-slate-500 mt-1">Approve invoices, record payments, view complete ledger</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="font-bold text-slate-800 block">Billing Employee</span>
          <p className="text-[11px] text-slate-500 mt-1">Generate invoices, duplicate, print, and register customers</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="font-bold text-slate-600 block">Viewer</span>
          <p className="text-[11px] text-slate-500 mt-1">Read-only access to customer records and invoice PDFs</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Staff Name & Username</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Department & Phone</th>
                <th className="py-3 px-3">Page Access Permissions</th>
                <th className="py-3 px-3 text-center">Login Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="text-xs font-medium">Loading staff list...</span>
                  </td>
                </tr>
              ) : employeeList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No staff members found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Add Staff Member" to register an employee.</p>
                  </td>
                </tr>
              ) : (
                employeeList.map((emp) => {
                  if (!emp) return null;
                  const empId = emp.employeeId || emp._id || 'EMP-01';
                  const name = emp.name || 'Staff Member';
                  const email = emp.email || '';
                  const username = emp.username || (email ? email.split('@')[0] : 'user');
                  const role = emp.role || 'Billing Employee';
                  const department = emp.department || 'Operations';
                  const phone = emp.phone || '—';
                  const isUserAdmin = role === 'Admin';
                  const pages = Array.isArray(emp.allowedPages) ? emp.allowedPages : [];
                  const isActive = String(emp.status || 'Active').toLowerCase() === 'active';

                  return (
                    <tr key={emp._id || empId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-sky-700">
                        {empId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{name}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                            @{username}
                          </span>
                          {email && (
                            <>
                              <span>•</span>
                              <span>{email}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          role === 'Admin'
                            ? 'bg-purple-100 text-purple-800'
                            : role === 'Manager'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium">{department}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{phone}</div>
                      </td>
                      <td className="py-3 px-3">
                        {isUserAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Sparkles className="w-3 h-3" />
                            <span>All Modules (Full Access)</span>
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {pages.map((p) => {
                              const found = SYSTEM_PAGES.find(sp => sp.id === p);
                              return (
                                <span
                                  key={p}
                                  className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium border border-slate-200"
                                >
                                  {found ? found.label.split(' ')[0] : p}
                                </span>
                              );
                            })}
                            {pages.length === 0 && (
                              <span className="text-[10px] text-rose-500 font-semibold">No pages granted</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            title="Edit Staff, Password & Page Access"
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-md transition cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp._id, name, empId)}
                            title="Remove Staff"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {showModal && typeof document !== 'undefined' && document.body && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs flex flex-col max-h-[92vh] animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isEditing ? `Edit Staff: ${formData.name || 'Member'}` : 'Register New Staff Member'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Configure username, password credentials & page permissions</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center font-bold text-sm transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Basic ID & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Employee ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 uppercase focus:ring-2 focus:ring-sky-500 bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Assigned Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-sky-500 transition"
                    >
                      <option value="Admin">Admin (Full Control)</option>
                      <option value="Manager">Manager</option>
                      <option value="Billing Employee">Billing Employee</option>
                      <option value="Viewer">Viewer (Read-only)</option>
                    </select>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 bg-white transition"
                  />
                </div>

                {/* Login Credentials Section */}
                <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 space-y-3">
                  <div className="flex items-center gap-2 text-sky-900 font-bold text-xs">
                    <Key className="w-3.5 h-3.5 text-sky-600" />
                    <span>Portal Login Access Credentials</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Login Username <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. karthik or anand"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-sky-500 bg-white transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        {isEditing ? 'New Password (Leave blank to keep)' : 'Account Password *'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required={!isEditing}
                          placeholder={isEditing ? '•••••••• (Unchanged)' : 'Enter password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full pl-3.5 pr-9 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-sky-500 bg-white transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="statusActive"
                      checked={formData.status === 'Active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'Active' : 'Inactive' })}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                    />
                    <label htmlFor="statusActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Enable login access for this staff member (Active)
                    </label>
                  </div>
                </div>

                {/* Email, Phone & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. anand@gkmetallab.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98400 12345"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 bg-white transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-sky-500 transition"
                  >
                    <option value="Mechanical Testing">Mechanical Testing</option>
                    <option value="Chemical Analysis">Chemical Analysis</option>
                    <option value="Non-Destructive Testing (NDT)">Non-Destructive Testing (NDT)</option>
                    <option value="Metallography">Metallography</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="Management & Technical QA">Management & Technical QA</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>

                {/* Page Access Permissions Section */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Layers className="w-3.5 h-3.5 text-sky-600" />
                        <span>Module & Page Access Permissions</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Check the pages this staff member is authorized to view
                      </p>
                    </div>

                    {formData.role !== 'Admin' && (
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={handleSelectAllPages}
                          className="text-sky-600 hover:text-sky-700 font-semibold cursor-pointer"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={handleClearAllPages}
                          className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {formData.role === 'Admin' ? (
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Administrators automatically have unrestricted access to all system modules and settings.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SYSTEM_PAGES.map((page) => {
                        const isChecked = (formData.allowedPages || []).includes(page.id);
                        return (
                          <label
                            key={page.id}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
                              isChecked
                                ? 'bg-sky-50/60 border-sky-300 text-slate-900'
                                : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100/60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePagePermission(page.id)}
                              className="w-4 h-4 mt-0.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                            />
                            <div>
                              <span className="font-bold text-xs block">{page.label}</span>
                              <span className="text-[10px] text-slate-500 leading-tight block">{page.desc}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/90 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl border border-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition active:scale-[0.98] cursor-pointer"
                >
                  {isEditing ? 'Save Changes' : 'Register Staff'}
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
