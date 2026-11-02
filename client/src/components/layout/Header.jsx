import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Bell,
  User,
  Shield,
  Menu,
  ChevronDown,
  Building,
  Check,
  LogOut,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

export default function Header({ toggleSidebar, openSearch }) {
  const navigate = useNavigate();
  const { currentUser, switchRole, logout, hasPageAccess } = useAuth();
  const { settings } = useSettings();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const roles = ['Admin', 'Manager', 'Billing Employee', 'Viewer'];

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/login');
  };

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

        {/* Quick Create Invoice CTA (only if permitted) */}
        {hasPageAccess('invoices') && (
          <NavLink
            to="/invoices/create"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-md shadow-xs transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Invoice</span>
          </NavLink>
        )}

        {/* User / Profile Menu */}
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
                {currentUser?.name || 'Administrator'}
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
                <p className="text-slate-500 text-[11px]">{currentUser?.email || currentUser?.username}</p>
                {currentUser?.username && (
                  <p className="text-slate-400 text-[10px] font-mono mt-0.5">
                    User: @{currentUser.username}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-600">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>{currentUser?.department || 'Operations'}</span>
                </div>
              </div>

              {/* Lab Settings (if permitted) */}
              {hasPageAccess('settings') && (
                <div className="px-2 pt-1 border-b border-slate-100 pb-1">
                  <NavLink
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3 py-1.5 rounded hover:bg-slate-100 text-slate-700"
                  >
                    Lab Settings & Configurations
                  </NavLink>
                </div>
              )}

              {/* Employees / Staff Access (if admin/permitted) */}
              {hasPageAccess('employees') && (
                <div className="px-2 pt-1 border-b border-slate-100 pb-1">
                  <NavLink
                    to="/employees"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-3 py-1.5 rounded hover:bg-slate-100 text-slate-700"
                  >
                    Manage Staff & Login Access
                  </NavLink>
                </div>
              )}

              {/* Logout Button */}
              <div className="px-2 pt-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold transition cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
