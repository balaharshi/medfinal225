import { Router } from 'express';
import authRoutes from './authRoutes.js';
import apiRoutes from './apiRoutes.js';

const router = Router();

router.use('/api/v1/auth', authRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/v1', apiRoutes);
router.use('/api', apiRoutes);

export default router;
