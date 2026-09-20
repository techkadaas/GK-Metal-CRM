import { store } from '../store/memoryStore.js';

export const getSettings = (req, res) => {
  try {
    const settings = store.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const updated = await store.updateSettings(req.body);
    res.json({ success: true, data: updated, message: 'Settings saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
