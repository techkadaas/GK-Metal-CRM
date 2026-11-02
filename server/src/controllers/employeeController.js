import bcrypt from 'bcryptjs';
import { store } from '../store/memoryStore.js';

const ALL_PAGES = ['dashboard', 'invoices', 'customers', 'services', 'reports', 'employees', 'settings'];

const sanitizeEmployee = (emp) => {
  if (!emp) return null;
  const { password, ...safe } = emp;
  safe.hasPassword = Boolean(password);
  if (!safe.allowedPages || !Array.isArray(safe.allowedPages) || safe.allowedPages.length === 0) {
    safe.allowedPages = safe.role === 'Admin'
      ? ALL_PAGES
      : ['dashboard', 'invoices', 'customers', 'services', 'reports'];
  }
  return safe;
};

export const getAllEmployees = async (req, res) => {
  try {
    const employees = await store.getEmployees();
    res.json({
      success: true,
      data: (employees || []).map(sanitizeEmployee)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const { name, email, role, password, username, allowedPages } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const payload = {
      ...req.body,
      username: (username || email.split('@')[0] || '').trim().toLowerCase(),
      status: req.body.status || 'Active'
    };

    if (password && password.trim()) {
      payload.password = bcrypt.hashSync(password.trim(), 10);
    } else {
      payload.password = bcrypt.hashSync('staff123', 10);
    }

    if (role === 'Admin') {
      payload.allowedPages = ALL_PAGES;
    } else if (Array.isArray(allowedPages)) {
      payload.allowedPages = allowedPages;
    } else {
      payload.allowedPages = ['dashboard', 'invoices', 'customers', 'services', 'reports'];
    }

    const newEmp = await store.createEmployee(payload);
    res.status(201).json({ success: true, data: sanitizeEmployee(newEmp) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const payload = { ...req.body };

    // Handle password update: only hash and update if non-empty string provided
    if (payload.password && String(payload.password).trim() !== '') {
      payload.password = bcrypt.hashSync(String(payload.password).trim(), 10);
    } else {
      delete payload.password;
    }

    if (payload.username) {
      payload.username = String(payload.username).trim().toLowerCase();
    }

    if (payload.role === 'Admin') {
      payload.allowedPages = ALL_PAGES;
    }

    const updated = await store.updateEmployee(req.params.id, payload);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: sanitizeEmployee(updated) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const success = await store.deleteEmployee(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
