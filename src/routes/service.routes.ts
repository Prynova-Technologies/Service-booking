import express from 'express';
import { getServices, getService, createService, updateService, deleteService } from '../controllers/service.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.get('/', getServices);
router.get('/:id', getService);

// Admin only routes
router.post('/', protect, restrictTo('admin'), createService);
router.patch('/:id', protect, restrictTo('admin'), updateService);
router.delete('/:id', protect, restrictTo('admin'), deleteService);

export default router;