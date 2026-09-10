import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Search,
  Plus,
  Bell,
  User,
  Shield,
  Menu,
  ChevronDown,
  Building,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

export default function Header({ toggleSidebar, openSearch }) {
  const { currentUser, switchRole } = useAuth();
  const { settings } = useSettings();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const roles = ['Admin', 'Manager', 'Billing Employee', 'Viewer'];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs no-print">
      {/* Left Area: Toggle & Quick Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Trigger Bar */}
        <button
          onClick={openSearch}
          className="flex-1 flex items-center justify-between px-3.5 py-1.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 rounded-lg text-slate-400 text-xs transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 font-normal">Search invoice no, buyer, GSTIN, service...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-500 shadow-xs">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right Area: FY Pill, Quick Action, Role & Profile */}
      <div className="flex items-center gap-3">
        {/* Active Financial Year Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold rounded-md">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
          <span>FY {settings?.invoiceConfig?.financialYear || '26-27'}</span>
        </div>

        {/* Quick Create Invoice CTA */}
        <NavLink
          to="/invoices/create"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-md shadow-xs transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Invoice</span>
        </NavLink>

        {/* User / Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser?.name || 'G. Karthikeyan'}
              </span>
              <span className="text-[10px] text-sky-700 font-medium">
                {currentUser?.role || 'Admin'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-40 animate-fade-in text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">{currentUser?.name}</p>
                <p className="text-slate-500 text-[11px]">{currentUser?.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-600">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>{currentUser?.department}</span>
                </div>
              </div>

              {/* Enterprise RBAC Role Switcher */}
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                  Simulate Role (RBAC)
                </p>
                <div className="space-y-1">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                        setUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1 rounded text-left ${
                        currentUser?.role === r
                          ? 'bg-sky-50 text-sky-700 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{r}</span>
                      {currentUser?.role === r && <Check className="w-3.5 h-3.5 text-sky-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-2 pt-1">
                <NavLink
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="block px-3 py-1.5 rounded hover:bg-slate-100 text-slate-700"
                >
                  Lab Settings & Configurations
                </NavLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
