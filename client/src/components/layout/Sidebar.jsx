import React from 'react';
import { NavLink } from 'react-router-dom';
import logoIcon from '../../assets/logo-icon-white.png';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  UserCheck,
  Settings,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors duration-150 ${
      isActive
        ? 'bg-sky-600 text-white shadow-sm font-semibold'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
    }`;

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-slate-900 border-r border-slate-800 text-white flex flex-col transition-all duration-200 no-print ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 bg-slate-950/60 justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-sky-600/30 border border-sky-400/40 p-1 flex items-center justify-center shrink-0">
            <img src={logoIcon} alt="GK" className="h-6 w-auto object-contain" />
          </div>
          {isOpen && (
            <span className="font-extrabold text-sm tracking-wide text-white uppercase whitespace-nowrap">
              GK METAL LAB
            </span>
          )}
        </NavLink>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {/* Dashboard */}
        <NavLink to="/dashboard" className={navLinkClass}>
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          {isOpen && <span>Dashboard</span>}
        </NavLink>

        {/* Invoices */}
        <NavLink to="/invoices" className={navLinkClass}>
          <FileText className="w-4 h-4 shrink-0" />
          {isOpen && <span>Invoices</span>}
        </NavLink>

        {/* Customers / Buyers */}
        <div className="pt-2">
          <NavLink to="/customers" className={navLinkClass}>
            <Building2 className="w-4 h-4 shrink-0" />
            {isOpen && <span>Customers</span>}
          </NavLink>
        </div>


        {/* Employees & RBAC */}
        <NavLink to="/employees" className={navLinkClass}>
          <UserCheck className="w-4 h-4 shrink-0" />
          {isOpen && <span>Employees</span>}
        </NavLink>

        {/* System Settings */}
        <NavLink to="/settings" className={navLinkClass}>
          <Settings className="w-4 h-4 shrink-0" />
          {isOpen && <span>Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}
