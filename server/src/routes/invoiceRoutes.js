import express from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  getNextInvoiceNumber,
  createInvoice,
  updateInvoice,
  duplicateInvoice,
  recordPayment,
  deleteInvoice
} from '../controllers/invoiceController.js';

const router = express.Router();

router.get('/next-number', getNextInvoiceNumber);
router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.post('/:id/duplicate', duplicateInvoice);
router.post('/:id/payments', recordPayment);
router.delete('/:id', deleteInvoice);

export default router;
