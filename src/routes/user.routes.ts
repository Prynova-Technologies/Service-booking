import express from 'express';
import { getUserProfile, updateUserProfile, getUsers, createUser, deleteUser } from '../controllers/user.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = express.Router();

// User routes
router.get('/profile', protect, getUserProfile);
router.patch('/profile', protect, updateUserProfile);

// Admin only routes
router.get('/', protect, restrictTo('admin'), getUsers);
router.post('/', protect, restrictTo('admin'), createUser);
router.patch('/:id', protect, restrictTo('admin'), updateUserProfile);
router.delete('/:id', protect, restrictTo('admin'), deleteUser);

export default router;