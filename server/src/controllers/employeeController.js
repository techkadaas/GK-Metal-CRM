import { store } from '../store/memoryStore.js';

export const getAllEmployees = (req, res) => {
  try {
    const employees = store.getEmployees();
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEmployee = (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }
    const newEmp = store.createEmployee(req.body);
    res.status(201).json({ success: true, data: newEmp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmployee = (req, res) => {
  try {
    const updated = store.updateEmployee(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEmployee = (req, res) => {
  try {
    const success = store.deleteEmployee(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
