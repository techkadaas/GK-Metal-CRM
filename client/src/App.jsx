import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import AppLayout from './components/layout/AppLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InvoiceListPage from './pages/InvoiceListPage';
import InvoiceCreatePage from './pages/InvoiceCreatePage';
import InvoiceEditPage from './pages/InvoiceEditPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import CustomersPage from './pages/CustomersPage';
import ServicesPage from './pages/ServicesPage';
import EmployeesPage from './pages/EmployeesPage';
import ReportManagementPage from './pages/ReportManagementPage';
import SettingsPage from './pages/SettingsPage';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

// Access Denied Fallback for Staff without page permission
function AccessDeniedPage() {
  const { currentUser } = useAuth();
  return (
    <div className="min-h-[500px] flex items-center justify-center p-6 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 mt-1">
            Your staff account (<span className="font-semibold text-slate-700">{currentUser?.name}</span>) does not have permission to access this module.
          </p>
        </div>
        <p className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          Please contact your System Administrator to request permission for this page.
        </p>
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Protected Route Guard
function ProtectedRoute({ pageId, children }) {
  const { isAuthenticated, loading, hasPageAccess } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-blue-200 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (pageId && !hasPageAccess(pageId)) {
    return <AccessDeniedPage />;
  }

  return children;
}

// Public Route Guard (Redirects away from /login if already logged in)
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <Routes>
              {/* Public Login Route */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />

              {/* Protected App Shell */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* Dashboard */}
                <Route
                  path="dashboard"
                  element={
                    <ProtectedRoute pageId="dashboard">
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Invoices Module */}
                <Route
                  path="invoices"
                  element={
                    <ProtectedRoute pageId="invoices">
                      <InvoiceListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="invoices/create"
                  element={
                    <ProtectedRoute pageId="invoices">
                      <InvoiceCreatePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="invoices/:id"
                  element={
                    <ProtectedRoute pageId="invoices">
                      <InvoiceDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="invoices/:id/edit"
                  element={
                    <ProtectedRoute pageId="invoices">
                      <InvoiceEditPage />
                    </ProtectedRoute>
                  }
                />

                {/* Masters */}
                <Route
                  path="customers"
                  element={
                    <ProtectedRoute pageId="customers">
                      <CustomersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="services"
                  element={
                    <ProtectedRoute pageId="services">
                      <ServicesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="employees"
                  element={
                    <ProtectedRoute pageId="employees">
                      <EmployeesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <ProtectedRoute pageId="reports">
                      <ReportManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute pageId="settings">
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
