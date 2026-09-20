import { store } from '../store/memoryStore.js';

export const getAllServices = (req, res) => {
  try {
    const services = store.getServices();
    const { category, search } = req.query;

    let result = [...services];
    if (category && category !== 'All') {
      result = result.filter(s => s.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.serviceCode?.toLowerCase().includes(q) ||
        s.hsnSac?.includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body.services;
    if (Array.isArray(items)) {
      if (items.length === 0) {
        return res.status(400).json({ success: false, message: 'No services provided' });
      }
      const validItems = items.filter(s => s && s.name && s.name.trim());
      if (validItems.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one service with a valid name is required' });
      }
      const createdServices = await store.createServices(validItems);
      return res.status(201).json({ success: true, count: createdServices.length, data: createdServices });
    }

    const { name, defaultRate } = req.body;
    if (!name || defaultRate === undefined) {
      return res.status(400).json({ success: false, message: 'Service name and default rate are required' });
    }
    const newService = await store.createService(req.body);
    res.status(201).json({ success: true, data: newService });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const updated = await store.updateService(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const success = await store.deleteService(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
