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
  Key
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function EmployeesPage() {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    role: 'Billing Employee',
    department: 'Accounts & Invoicing',
    status: 'Active'
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.getEmployees();
      if (res.success && res.data) {
        setEmployees(res.data);
      }
    } catch (e) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      employeeId: `EMP-0${employees.length + 1}`,
      name: '',
      email: '',
      phone: '',
      role: 'Billing Employee',
      department: 'Accounts & Invoicing',
      status: 'Active'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (emp) => {
    setIsEditing(true);
    setFormData(emp);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and Email are required');
      return;
    }

    try {
      if (isEditing) {
        const res = await api.updateEmployee(formData._id, formData);
        if (res.success) {
          toast.success(`Updated ${formData.name}`);
          setShowModal(false);
          fetchEmployees();
        }
      } else {
        const res = await api.createEmployee(formData);
        if (res.success) {
          toast.success(`Added ${formData.name}`);
          setShowModal(false);
          fetchEmployees();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save employee');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete employee user "${name}"?`)) {
      try {
        const res = await api.deleteEmployee(id);
        if (res.success) {
          toast.success('Employee deleted');
          fetchEmployees();
        }
      } catch (e) {
        toast.error('Failed to delete employee');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff & Roles (RBAC)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized billing operators, lab managers, and access permissions
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-sm transition active:scale-[0.98] border border-sky-400/30"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Employee</span>
        </button>
      </div>

      {/* Role Matrix Overview Pill */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="font-bold text-slate-900 block">Admin</span>
          <p className="text-[11px] text-slate-500 mt-1">Full control over Settings, Tax, Invoices, Deletion, Bank</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="font-bold text-slate-900 block">Manager</span>
          <p className="text-[11px] text-slate-500 mt-1">Approve invoices, record payments, view complete ledger</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="font-bold text-slate-900 block">Billing Employee</span>
          <p className="text-[11px] text-slate-500 mt-1">Generate invoices, duplicate, print, and register customers</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="font-bold text-slate-900 block">Viewer</span>
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
                <th className="py-3 px-4">Name & Email</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp._id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-sky-700">
                    {emp.employeeId}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{emp.name}</div>
                    <div className="text-[11px] text-slate-500">{emp.email}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      emp.role === 'Admin'
                        ? 'bg-purple-100 text-purple-800'
                        : emp.role === 'Manager'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {emp.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {emp.department || 'Operations'}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {emp.phone || '—'}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        title="Edit Role"
                        className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp._id, emp.name)}
                        title="Remove Employee"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-xs flex flex-col max-h-[90vh] animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isEditing ? 'Edit Staff Member' : 'Register New Employee'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Manage laboratory staff profile and portal role</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Employee ID <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.employeeId || ''}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 uppercase focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Assigned Role <span className="text-rose-500">*</span></label>
                    <select
                      value={formData.role || 'Billing Employee'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                      <option value="Billing Employee">Billing Employee</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Full Name <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Kumar"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Email Address <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. anand@gkmetallab.com"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Phone Number <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 98400 12345"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Role / Designation <span className="text-rose-500">*</span></label>
                    <select
                      value={formData.role || 'Senior Metallurgist'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    >
                      <option value="Senior Metallurgist">Senior Metallurgist</option>
                      <option value="Quality Engineer">Quality Engineer</option>
                      <option value="NDT Inspector">NDT Inspector</option>
                      <option value="Lab Technician">Lab Technician</option>
                      <option value="Accounts Manager">Accounts Manager</option>
                      <option value="Admin">System Administrator</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Department <span className="text-rose-500">*</span></label>
                    <select
                      value={formData.department || 'Mechanical Testing'}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-slate-50 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    >
                      <option value="Mechanical Testing">Mechanical Testing</option>
                      <option value="Chemical Analysis">Chemical Analysis</option>
                      <option value="Non-Destructive Testing (NDT)">Non-Destructive Testing (NDT)</option>
                      <option value="Metallography">Metallography</option>
                      <option value="Finance & Accounts">Finance & Accounts</option>
                      <option value="Administration">Administration</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    {isEditing ? 'New Password (Leave blank to keep current)' : 'Account Password *'}
                  </label>
                  <input
                    type="password"
                    required={!isEditing}
                    placeholder="••••••••"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white transition"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={Boolean(formData.isActive ?? true)}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <label htmlFor="isActive" className="text-xs font-semibold text-slate-700">
                    Active Employee (Allowed to login and access system)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/90 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl border border-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition active:scale-[0.98]"
                >
                  {isEditing ? 'Save Changes' : 'Add Employee'}
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
