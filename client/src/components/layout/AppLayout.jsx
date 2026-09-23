import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalSearchModal from '../common/GlobalSearchModal';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcuts listener: Ctrl+K / Cmd+K for Search, Ctrl+N for New Invoice
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-900 print:bg-white print:block print:min-h-0">
      {/* Enterprise Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 print:m-0 print:ml-0 print:p-0 print:block ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <main className="flex-1 p-6 md:p-8 max-w-[1700px] w-full mx-auto print:p-0 print:m-0 print:max-w-full print:block">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
