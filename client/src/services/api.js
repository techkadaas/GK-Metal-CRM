const rawApiUrl = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/$/, '');
const API_BASE = rawApiUrl.endsWith('/api')
  ? rawApiUrl
  : (rawApiUrl === '' || rawApiUrl === '/api' ? '/api' : `${rawApiUrl}/api`);

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  return response.json();
}

// LocalStorage Persistent Storage Keys
const STORAGE_KEYS = {
  INVOICES: 'gkmetal_crm_local_invoices_v1',
  CUSTOMERS: 'gkmetal_crm_local_customers_v1',
  SERVICES: 'gkmetal_crm_local_services_v1',
  SETTINGS: 'gkmetal_crm_local_settings_v1',
  EMPLOYEES: 'gkmetal_crm_local_employees_v1'
};

function getLocalData(key) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
}

function setLocalData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Ignore storage quota errors
  }
}

export const api = {
  // Health
  getHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return handleResponse(res);
    } catch (e) {
      return { status: 'offline', error: e.message };
    }
  },

  // Dashboard
  getDashboardMetrics: async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard/metrics`);
      return handleResponse(res);
    } catch (e) {
      // Offline calculate basic metrics from local cache
      const invoices = getLocalData(STORAGE_KEYS.INVOICES) || [];
      const customers = getLocalData(STORAGE_KEYS.CUSTOMERS) || [];
      let totalBilled = 0, paidAmount = 0, pendingPayments = 0;
      invoices.forEach(inv => {
        if (inv.status !== 'Cancelled' && inv.status !== 'Draft') {
          totalBilled += inv.grandTotal || 0;
          paidAmount += inv.paidAmount || 0;
          pendingPayments += inv.balanceDue || 0;
        }
      });
      return {
        success: true,
        data: {
          kpis: {
            totalInvoices: invoices.length,
            totalCustomers: customers.length,
            thisMonthBilled: totalBilled,
            pendingPayments,
            paidAmount,
            draftInvoices: invoices.filter(i => i.status === 'Draft').length,
            cancelledInvoices: invoices.filter(i => i.status === 'Cancelled').length,
            paidInvoices: invoices.filter(i => i.status === 'Paid').length,
            pendingInvoices: invoices.filter(i => i.status !== 'Paid' && i.status !== 'Draft' && i.status !== 'Cancelled').length
          },
          monthlyRevenue: {},
          recentInvoices: invoices.slice(0, 7)
        }
      };
    }
  },

  // Invoices
  getInvoices: async (params = {}) => {
    const hasFilters = Object.keys(params).length > 0;
    const query = new URLSearchParams(params).toString();
    try {
      const res = await fetch(`${API_BASE}/invoices?${query}`);
      const data = await handleResponse(res);
      if (data.success && Array.isArray(data.data)) {
        if (!hasFilters) {
          setLocalData(STORAGE_KEYS.INVOICES, data.data);
        }
        return data;
      }
      return data;
    } catch (e) {
      const cached = getLocalData(STORAGE_KEYS.INVOICES) || [];
      return { success: true, data: cached, count: cached.length, isOffline: true };
    }
  },

  getInvoiceById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/invoices/${id}`);
      const data = await handleResponse(res);
      return data;
    } catch (e) {
      const cached = getLocalData(STORAGE_KEYS.INVOICES) || [];
      const item = cached.find(inv => inv._id === id || inv.invoiceNumber === id);
      if (item) return { success: true, data: item };
      throw e;
    }
  },

  getNextInvoiceNumber: async () => {
    try {
      const res = await fetch(`${API_BASE}/invoices/next-number`);
      return handleResponse(res);
    } catch (e) {
      const settings = getLocalData(STORAGE_KEYS.SETTINGS);
      const invoices = getLocalData(STORAGE_KEYS.INVOICES) || [];
      const prefix = settings?.invoiceConfig?.prefix || 'GK/INV/';
      const fy = settings?.invoiceConfig?.financialYear || '26-27';
      const nextSeq = invoices.length + 1;
      const nextInvoiceNumber = `${prefix}${fy}/${String(nextSeq).padStart(3, '0')}`;
      return {
        success: true,
        data: {
          nextInvoiceNumber,
          invoiceNumber: nextInvoiceNumber,
          sequenceNumber: nextSeq,
          financialYear: fy,
          prefix
        }
      };
    }
  },

  createInvoice: async (data) => {
    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await handleResponse(res);
    if (result.success && result.data) {
      const cached = getLocalData(STORAGE_KEYS.INVOICES) || [];
      setLocalData(STORAGE_KEYS.INVOICES, [result.data, ...cached.filter(i => i._id !== result.data._id && i.invoiceNumber !== result.data.invoiceNumber)]);
    }
    return result;
  },

  updateInvoice: async (id, data) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await handleResponse(res);
    if (result.success && result.data) {
      const cached = getLocalData(STORAGE_KEYS.INVOICES) || [];
      const index = cached.findIndex(i => i._id === id || i.invoiceNumber === id);
      if (index !== -1) cached[index] = result.data;
      else cached.unshift(result.data);
      setLocalData(STORAGE_KEYS.INVOICES, cached);
    }
    return result;
  },

  duplicateInvoice: async (id, customData = {}) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customData)
    });
    const result = await handleResponse(res);
    if (result.success && result.data) {
      const cached = getLocalData(STORAGE_KEYS.INVOICES) || [];
      setLocalData(STORAGE_KEYS.INVOICES, [result.data, ...cached]);
    }
    return result;
  },

  recordPayment: async (id, paymentData) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    const result = await handleResponse(res);
    if (result.success && result.data) {
      const cached = getLocalData(STORAGE_KEYS.INVOICES) || [];
      const index = cached.findIndex(i => i._id === id || i.invoiceNumber === id);
      if (index !== -1) cached[index] = result.data;
      setLocalData(STORAGE_KEYS.INVOICES, cached);
    }
    return result;
  },

  deleteInvoice: async (id, permanent = false) => {
    const res = await fetch(`${API_BASE}/invoices/${id}?permanent=${permanent}`, {
      method: 'DELETE'
    });
    const result = await handleResponse(res);
    const cached = getLocalData(STORAGE_KEYS.INVOICES) || [];
    if (permanent) {
      setLocalData(STORAGE_KEYS.INVOICES, cached.filter(i => i._id !== id && i.invoiceNumber !== id));
    } else {
      const index = cached.findIndex(i => i._id === id || i.invoiceNumber === id);
      if (index !== -1) cached[index].status = 'Cancelled';
      setLocalData(STORAGE_KEYS.INVOICES, cached);
    }
    return result;
  },

  // Customers
  getCustomers: async (params = {}) => {
    const hasFilters = Object.keys(params).length > 0;
    const query = new URLSearchParams(params).toString();
    try {
      const res = await fetch(`${API_BASE}/customers?${query}`);
      const data = await handleResponse(res);
      if (data.success && Array.isArray(data.data)) {
        if (!hasFilters) {
          setLocalData(STORAGE_KEYS.CUSTOMERS, data.data);
        }
        return data;
      }
      return data;
    } catch (e) {
      const cached = getLocalData(STORAGE_KEYS.CUSTOMERS) || [];
      return { success: true, data: cached, count: cached.length, isOffline: true };
    }
  },

  getCustomerById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/customers/${id}`);
      return handleResponse(res);
    } catch (e) {
      const cached = getLocalData(STORAGE_KEYS.CUSTOMERS) || [];
      const item = cached.find(c => c._id === id || c.customerId === id);
      if (item) return { success: true, data: item };
      throw e;
    }
  },

  createCustomer: async (data) => {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await handleResponse(res);
    if (result.success && result.data) {
      const cached = getLocalData(STORAGE_KEYS.CUSTOMERS) || [];
      setLocalData(STORAGE_KEYS.CUSTOMERS, [result.data, ...cached.filter(c => c._id !== result.data._id && c.customerId !== result.data.customerId)]);
    }
    return result;
  },

  updateCustomer: async (id, data) => {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await handleResponse(res);
    if (result.success && result.data) {
      const cached = getLocalData(STORAGE_KEYS.CUSTOMERS) || [];
      const index = cached.findIndex(c => c._id === id || c.customerId === id);
      if (index !== -1) cached[index] = result.data;
      else cached.unshift(result.data);
      setLocalData(STORAGE_KEYS.CUSTOMERS, cached);
    }
    return result;
  },

  deleteCustomer: async (id) => {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE'
    });
    const result = await handleResponse(res);
    const cached = getLocalData(STORAGE_KEYS.CUSTOMERS) || [];
    setLocalData(STORAGE_KEYS.CUSTOMERS, cached.filter(c => c._id !== id && c.customerId !== id));
    return result;
  },

  // Services Catalog
  getServices: async (params = {}) => {
    const hasFilters = Object.keys(params).length > 0;
    const query = new URLSearchParams(params).toString();
    try {
      const res = await fetch(`${API_BASE}/services?${query}`);
      const data = await handleResponse(res);
      if (data.success && Array.isArray(data.data)) {
        if (!hasFilters) {
          setLocalData(STORAGE_KEYS.SERVICES, data.data);
        }
        return data;
      }
      return data;
    } catch (e) {
      const cached = getLocalData(STORAGE_KEYS.SERVICES) || [];
      return { success: true, data: cached, count: cached.length, isOffline: true };
    }
  },

  createService: async (data) => {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await handleResponse(res);
    if (result.success && result.data) {
      const cached = getLocalData(STORAGE_KEYS.SERVICES) || [];
      setLocalData(STORAGE_KEYS.SERVICES, [...cached, result.data]);
    }
    return result;
  },

  createMultipleServices: async (servicesArray) => {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(servicesArray)
    });
    return handleResponse(res);
  },

  updateService: async (id, data) => {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteService: async (id) => {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'DELETE'
    });
    const result = await handleResponse(res);
    const cached = getLocalData(STORAGE_KEYS.SERVICES) || [];
    setLocalData(STORAGE_KEYS.SERVICES, cached.filter(s => s._id !== id && s.serviceCode !== id));
    return result;
  },

  // Employees
  getEmployees: async () => {
    try {
      const res = await fetch(`${API_BASE}/employees`);
      return handleResponse(res);
    } catch (e) {
      const cached = getLocalData(STORAGE_KEYS.EMPLOYEES) || [];
      return { success: true, data: cached };
    }
  },

  createEmployee: async (data) => {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateEmployee: async (id, data) => {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteEmployee: async (id) => {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Settings
  getSettings: async () => {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      const data = await handleResponse(res);
      if (data.success && data.data) {
        setLocalData(STORAGE_KEYS.SETTINGS, data.data);
      }
      return data;
    } catch (e) {
      const cached = getLocalData(STORAGE_KEYS.SETTINGS);
      if (cached) return { success: true, data: cached };
      throw e;
    }
  },

  updateSettings: async (data) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await handleResponse(res);
    if (result.success && result.data) {
      setLocalData(STORAGE_KEYS.SETTINGS, result.data);
    }
    return result;
  }
};
