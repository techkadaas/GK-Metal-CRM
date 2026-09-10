import React from 'react';
import { NavLink } from 'react-router-dom';
import logoIcon from '../../assets/logo-icon-white.png';
import {
  LayoutDashboard,
  FileText,
  Building2,
  UserCheck,
  Settings,
  Layers,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
      isActive
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-950/50 border border-blue-400/30'
        : 'text-blue-100/70 hover:text-white hover:bg-white/[0.08] active:scale-[0.98]'
    }`;

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-gradient-to-b from-[#0b1938] via-[#0e214d] to-[#081229] border-r border-blue-900/40 text-white flex flex-col transition-all duration-200 no-print shadow-xl shadow-slate-950/20 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-blue-900/40 bg-[#07132a]/70 backdrop-blur-xs justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 overflow-hidden group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 border border-blue-400/40 p-1 flex items-center justify-center shrink-0 shadow-sm shadow-blue-900/50 group-hover:scale-105 transition">
            <img src={logoIcon} alt="GK" className="h-5 w-auto object-contain" />
          </div>
          {isOpen && (
            <div className="min-w-0">
              <span className="font-extrabold text-sm tracking-wide text-white uppercase whitespace-nowrap block leading-tight">
                GK METAL LAB
              </span>
              <span className="text-[10px] text-blue-300 font-medium tracking-wider uppercase block">
                Testing CRM
              </span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {/* Navigation Section Title (when open) */}
        {isOpen && (
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-blue-300/50">
            Main Menu
          </div>
        )}

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
        <NavLink to="/customers" className={navLinkClass}>
          <Building2 className="w-4 h-4 shrink-0" />
          {isOpen && <span>Customers</span>}
        </NavLink>

        {/* Section divider */}
        {isOpen && (
          <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-blue-300/50">
            Administration
          </div>
        )}

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

      {/* Sidebar Footer Badge */}
      {isOpen && (
        <div className="p-3 border-t border-blue-900/30 bg-[#061024]/50">
          <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/40 flex items-center justify-between text-[11px] text-blue-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">System Online</span>
            </div>
            <span className="font-mono text-[10px] text-blue-300 font-bold">v1.0.0</span>
          </div>
        </div>
      )}
    </aside>
  );
}

