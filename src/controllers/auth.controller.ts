import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import logger from '../utils/logger';

// Generate JWT token
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Log registration failure
      logger.warn('Registration failed - user already exists', { email });
      
      return res.status(400).json({
        success: false,
        message: 'User already exists, please login instead',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'user', // Default role
    });

    // Generate token
    const token = generateToken(user._id);
    
    // Log successful registration
    logger.info('User registered successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error: any) {
    // Log registration error
    logger.error('Registration error', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      // Log login attempt with missing credentials
      logger.warn('Login failed - missing credentials', { 
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Log failed login attempt - user not found
      logger.warn('Login failed - user not found', { 
        email,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Log failed login attempt - invalid password
      logger.warn('Login failed - invalid password', { 
        userId: user._id,
        email,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user._id);
    
    // Log successful login
    logger.info('User logged in successfully', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    // Log login error
    logger.error('Login error', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Login admin
 * @route POST /api/auth/admin/login
 * @access Public
 */
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      // Log admin login attempt with missing credentials
      logger.warn('Admin login failed - missing credentials', { 
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check if user exists and is an admin
    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    if (!user) {
      // Log failed admin login attempt - user not found or not admin
      logger.warn('Admin login failed - invalid credentials or not admin', { 
        email,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or not an admin',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Log failed admin login attempt - invalid password
      logger.warn('Admin login failed - invalid password', { 
        userId: user._id,
        email,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user._id);
    
    // Log successful admin login
    logger.info('Admin logged in successfully', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    // Log admin login error
    logger.error('Admin login error', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Get current user
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Log user profile access
    logger.info('User profile accessed', {
      userId: req.user._id,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      data: {
        id: user?._id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
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