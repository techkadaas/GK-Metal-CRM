const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  return response.json();
}


export const api = {
  // Dashboard
  getDashboardMetrics: async () => {
    const res = await fetch(`${API_BASE}/dashboard/metrics`);
    return handleResponse(res);
  },

  // Invoices
  getInvoices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/invoices?${query}`);
    return handleResponse(res);
  },

  getInvoiceById: async (id) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`);
    return handleResponse(res);
  },

  getNextInvoiceNumber: async () => {
    const res = await fetch(`${API_BASE}/invoices/next-number`);
    return handleResponse(res);
  },

  createInvoice: async (data) => {
    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateInvoice: async (id, data) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  duplicateInvoice: async (id, customData = {}) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customData)
    });
    return handleResponse(res);
  },

  recordPayment: async (id, paymentData) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    return handleResponse(res);
  },

  deleteInvoice: async (id, permanent = false) => {
    const res = await fetch(`${API_BASE}/invoices/${id}?permanent=${permanent}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Customers
  getCustomers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/customers?${query}`);
    return handleResponse(res);
  },

  getCustomerById: async (id) => {
    const res = await fetch(`${API_BASE}/customers/${id}`);
    return handleResponse(res);
  },

  createCustomer: async (data) => {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateCustomer: async (id, data) => {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteCustomer: async (id) => {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Services Catalog
  getServices: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/services?${query}`);
    return handleResponse(res);
  },

  createService: async (data) => {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
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
    return handleResponse(res);
  },

  // Employees
  getEmployees: async () => {
    const res = await fetch(`${API_BASE}/employees`);
    return handleResponse(res);
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
    const res = await fetch(`${API_BASE}/settings`);
    return handleResponse(res);
  },

  updateSettings: async (data) => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};
