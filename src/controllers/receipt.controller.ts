import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Receipt from '../models/receipt.model';
import Booking from '../models/booking.model';
import logger from '../utils/logger';

/**
 * Generate a receipt for a completed booking
 * @route POST /api/receipts
 * @access Private/Admin
 */
export const generateReceipt = async (req: Request, res: Response) => {
  try {
    const { bookingId, servicePersonnelName, finalPrice } = req.body;

    // Validate required fields
    if (!bookingId || !servicePersonnelName || !finalPrice) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId, servicePersonnelName, and finalPrice',
      });
    }

    // Check if booking exists and is completed
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate receipt for a booking that is not completed',
      });
    }

    // Check if receipt already exists for this booking
    const existingReceipt = await Receipt.findOne({ booking: bookingId });
    if (existingReceipt) {
      return res.status(400).json({
        success: false,
        message: 'Receipt already exists for this booking',
        data: existingReceipt,
      });
    }

    // Create receipt
    const receipt = await Receipt.create({
      booking: bookingId,
      finalPrice: parseFloat(finalPrice.toString()),
      servicePersonnelName,
      completionDate: new Date(),
    });

    // Update booking with receipt ID
    booking.receiptId = receipt._id;
    booking.completedPrice = parseFloat(finalPrice.toString());
    await booking.save();

    // Return receipt with populated booking details
    const populatedReceipt = await Receipt.findById(receipt._id).populate({
      path: 'booking',
      populate: [
        { path: 'service', select: 'name price iconName' },
        { path: 'user', select: 'name email' },
      ],
    });

    res.status(201).json({
      success: true,
      data: populatedReceipt,
    });
  } catch (error: any) {
    // Log the error with details
    logger.error('Error generating receipt', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Get receipt by ID
 * @route GET /api/receipts/:id
 * @access Private/Admin
 */
export const getReceiptById = async (req: Request, res: Response) => {
  try {
    const receipt = await Receipt.findById(req.params.id).populate({
      path: 'booking',
      populate: [
        { path: 'service', select: 'name price iconName' },
        { path: 'user', select: 'name email' },
      ],
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found',
      });
    }

    res.status(200).json({
      success: true,
      data: receipt,
    });
  } catch (error: any) {
    // Log the error with details
    logger.error('Error fetching receipt', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Get receipt by booking ID
 * @route GET /api/receipts/booking/:bookingId
 * @access Private/Admin
 */
export const getReceiptByBookingId = async (req: Request, res: Response) => {
  try {
    const receipt = await Receipt.findOne({ booking: req.params.bookingId }).populate({
      path: 'booking',
      populate: [
        { path: 'service', select: 'name price iconName' },
        { path: 'user', select: 'name email' },
      ],
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found for this booking',
      });
    }

    res.status(200).json({
      success: true,
      data: receipt,
    });
  } catch (error: any) {
    // Log the error with details
    logger.error('Error fetching receipt by booking ID', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Get all receipts
 * @route GET /api/receipts
 * @access Private/Admin
 */
export const getAllReceipts = async (req: Request, res: Response) => {
  try {
    const receipts = await Receipt.find().populate({
      path: 'booking',
      populate: [
        { path: 'service', select: 'name price iconName' },
        { path: 'user', select: 'name email' },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: receipts,
    });
  } catch (error: any) {
    // Log the error with details
    logger.error('Error fetching all receipts', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};