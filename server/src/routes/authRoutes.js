import express from 'express';
import { login, getCurrentUser, changeCredentials } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', getCurrentUser);
router.post('/change-credentials', changeCredentials);

export default router;
