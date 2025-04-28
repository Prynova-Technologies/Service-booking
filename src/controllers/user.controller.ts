import { Request, Response } from 'express';
import User from '../models/user.model';
import logger from '../utils/logger';

/**
 * Get user profile
 * @route GET /api/users/profile
 * @access Private
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      // Log user not found
      logger.warn('User profile access failed - user not found', {
        requestedId: req.user._id,
        ip: req.ip
      });

      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Log successful profile access
    logger.info('User profile accessed', {
      userId: user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    // Log error
    logger.error('Error fetching user profile', { 
      userId: req.user?._id,
      error: error.message, 
      stack: error.stack 
    });

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { name, email, phone } = req.body;

    // Find user
    const user = await User.findById(req.user._id);

    if (!user) {
      // Log user not found
      logger.warn('User profile update failed - user not found', {
        requestedId: req.user._id,
        ip: req.ip
      });

      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Log profile update attempt
    logger.info('User profile update initiated', {
      userId: user._id,
      updatedFields: Object.keys(req.body).filter(key => req.body[key]),
      ip: req.ip
    });

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    // if (phone) user.phone = phone;

    // Save user
    await user.save();

    // Log successful profile update
    logger.info('User profile updated successfully', {
      userId: user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    // Log error
    logger.error('Error updating user profile', { 
      userId: req.user?._id,
      error: error.message, 
      stack: error.stack 
    });

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Get all users (admin only)
 * @route GET /api/users
 * @access Private/Admin
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');

    // Log admin accessing all users
    logger.info('Admin accessed all users', {
      adminId: req.user._id,
      userCount: users.length,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error: any) {
    // Log error
    logger.error('Error fetching all users', { 
      adminId: req.user?._id,
      error: error.message, 
      stack: error.stack 
    });

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Create a new user (admin only)
 * @route POST /api/users
 * @access Private/Admin
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if required fields are provided
    if (!name || !email || !password) {
      // Log missing fields
      logger.warn('User creation failed - missing required fields', {
        adminId: req.user._id,
        providedFields: Object.keys(req.body),
        ip: req.ip
      });

      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      // Log user already exists
      logger.warn('User creation failed - email already exists', {
        adminId: req.user._id,
        email,
        ip: req.ip
      });

      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Log user creation attempt
    logger.info('Admin creating new user', {
      adminId: req.user._id,
      newUserEmail: email,
      newUserRole: role || 'user',
      ip: req.ip
    });

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
    });

    // Log successful user creation
    logger.info('User created successfully by admin', {
      adminId: req.user._id,
      newUserId: user._id,
      newUserEmail: user.email,
      newUserRole: user.role,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    // Log error
    logger.error('Error creating user', { 
      adminId: req.user?._id,
      error: error.message, 
      stack: error.stack 
    });

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Delete a user (admin only)
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      // Log user not found
      logger.warn('User deletion failed - user not found', {
        adminId: req.user._id,
        targetUserId: userId,
        ip: req.ip
      });

      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Log user deletion attempt
    logger.info('Admin attempting to delete user', {
      adminId: req.user._id,
      targetUserId: userId,
      targetUserEmail: user.email,
      targetUserRole: user.role,
      ip: req.ip
    });

    // Delete user
    await User.findByIdAndDelete(userId);

    // Log successful user deletion
    logger.info('User deleted successfully by admin', {
      adminId: req.user._id,
      deletedUserId: userId,
      deletedUserEmail: user.email,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    // Log error
    logger.error('Error deleting user', { 
      adminId: req.user?._id,
      targetUserId: req.params.id,
      error: error.message, 
      stack: error.stack 
    });

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};