import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import AppLayout from './components/layout/AppLayout';

import DashboardPage from './pages/DashboardPage';
import InvoiceListPage from './pages/InvoiceListPage';
import InvoiceCreatePage from './pages/InvoiceCreatePage';
import InvoiceEditPage from './pages/InvoiceEditPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import CustomersPage from './pages/CustomersPage';
import ServicesPage from './pages/ServicesPage';
import EmployeesPage from './pages/EmployeesPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <Routes>
              {/* App Shell Wrapper */}
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />

                {/* Invoices Module */}
                <Route path="invoices">
                  <Route index element={<InvoiceListPage />} />
                  <Route path="create" element={<InvoiceCreatePage />} />
                  <Route path=":id" element={<InvoiceDetailPage />} />
                  <Route path=":id/edit" element={<InvoiceEditPage />} />
                </Route>

                {/* Masters */}
                <Route path="customers" element={<CustomersPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="settings" element={<SettingsPage />} />

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
