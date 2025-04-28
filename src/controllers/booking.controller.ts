import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Booking, { BookingStatus } from '../models/booking.model';
import Service from '../models/service.model';
import { io } from '../index';
import { sendPushNotification } from '../services/notification.service';
import logger from '../utils/logger';
import { sendBookingNotificationToAdmin, sendBookingConfirmationToCustomer, sendBookingStatusUpdateToCustomer, sendEmail } from '../utils/email';
// Import the PDF utility
const { generateReceiptPDF, cleanupReceiptPDF } = require('../utils/pdf')

/**
 * Get all bookings for the current user
 * @route GET /api/bookings
 * @access Private
 */
export const getBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('service', 'name price iconName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error: any) {
    // Log the error with details
    logger.error('Error fetching bookings', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Get all bookings for a specific customer
 * @route GET /api/bookings/customer/:customerId
 * @access Private/Admin
 */
export const getCustomerBookings = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    
    // Validate customerId
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID format',
      });
    }
    
    // Parse query parameters for filtering
    const { status, serviceId, date } = req.query;
    
    // Build filter object
    const filter: any = { user: customerId };
    
    if (status) filter.status = status;
    if (serviceId) filter.service = serviceId;
    if (date) filter.date = date;
    
    const bookings = await Booking.find(filter)
      .populate('service', 'name price iconName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error: any) {
    // Log the error with details
    logger.error('Error fetching customer bookings', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Get all bookings (admin only)
 * @route GET /api/bookings/all
 * @access Private/Admin
 */
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    // Parse query parameters for filtering
    const { status, serviceId, date } = req.query;
    
    // Build filter object
    const filter: any = {};
    
    if (status) filter.status = status;
    if (serviceId) filter.service = serviceId;
    if (date) filter.date = date;
    
    const bookings = await Booking.find(filter)
      .populate('service', 'name price iconName')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error: any) {
    // Log the error with details
    logger.error('Error fetching all bookings', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Get a single booking
 * @route GET /api/bookings/:id
 * @access Private
 */
export const getBooking = async (req: Request, res: Response) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'name description price iconName')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if the booking belongs to the current user or if the user is an admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    // Log the error with details
    logger.error('Error fetching booking details', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Create a new booking
 * @route POST /api/bookings
 * @access Private
 */
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { serviceId, date, time, address, notes } = req.body;

    // Validate required fields
    if (!serviceId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Please provide service, date, and time',
      });
    }

    // Check if the date falls within any off-duty period
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0); // Remove time part for comparison
    
    const OffDutyPeriod = mongoose.model('OffDutyPeriod');
    const offDutyPeriods = await OffDutyPeriod.find({
      startDate: { $lte: selectedDate },
      endDate: { $gte: selectedDate }
    });
    
    if (offDutyPeriods.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'The selected date is unavailable for booking',
        offDutyPeriod: offDutyPeriods[0]
      });
    }

    // Get service details to access the price
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Create booking
    const booking = await Booking.create({
      service: serviceId,
      user: req.user._id,
      date,
      time,
      status: 'pending',
      startingPrice: parseFloat(service.price),
      address,
      notes,
    });

    // Populate service and user details for the response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('service', 'name price iconName')
      .populate('user', 'name email');

    // Notify admin about new booking via Socket.io
    io.to('admin').emit('admin:newBooking', {
      bookingId: booking._id,
      serviceName: service.name,
      customerName: req.user.name,
    });
    
    // Send email notifications to admin and customer
    try {
      // Send notification to admin
      await sendBookingNotificationToAdmin(
        booking,
        req.user.name,
        req.user.email,
        service.name
      );
      
      // Send confirmation to customer
      await sendBookingConfirmationToCustomer(
        booking,
        req.user.name,
        req.user.email,
        service.name
      );
    } catch (emailError) {
      logger.error('Failed to send booking email notification:', { error: emailError.message });
      // Continue even if email notification fails
    }

    res.status(201).json({
      success: true,
      data: populatedBooking,
    });
  } catch (error: any) {
    // Log the error with details
    logger.error('Error creating booking', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Update booking status
 * @route PATCH /api/bookings/:id/status
 * @access Private/Admin
 */
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { status, cancellationReason, servicePersonnelName } = req.body;

    // Validate status
    if (!status || !['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status',
      });
    }

    // Find booking
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'name')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }
    
    // If status is being set to cancelled, require a cancellation reason
    if (status === 'cancelled' && !cancellationReason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a cancellation reason',
      });
    }

    // Update status
    booking.status = status as BookingStatus;
    
    // If status is being set to cancelled, set the cancellation reason
    if (status === 'cancelled' && cancellationReason) {
      booking.cancellationReason = cancellationReason;
    }
    
    // If status is being set to completed, allow setting the completed price
    if (status === 'completed' && req.body.completedPrice) {
      booking.completedPrice = parseFloat(req.body.completedPrice);
      
      // If service personnel name is provided, generate a receipt
      if (servicePersonnelName) {
        try {
          const Receipt = mongoose.model('Receipt');
          const receipt = await Receipt.create({
            booking: booking._id,
            finalPrice: booking.completedPrice,
            servicePersonnelName: servicePersonnelName,
            completionDate: new Date(),
          });
          
          // Update booking with receipt ID
          booking.receiptId = receipt._id;
          
          logger.info('Receipt generated successfully', { 
            receiptId: receipt._id, 
            bookingId: booking._id,
            finalPrice: booking.completedPrice
          });
        } catch (receiptError: any) {
          logger.error('Failed to generate receipt:', { error: receiptError.message, stack: receiptError.stack });
          // Continue even if receipt generation fails
        }
      }
    }
    
    await booking.save();

    // Send real-time notification via Socket.io
    io.to(`user:${booking.user._id}`).emit('notification', {
      type: 'booking_status',
      title: 'Booking Update',
      message: `Your booking for ${booking.service.name} has been ${status}${status === 'cancelled' && cancellationReason ? `: ${cancellationReason}` : ''}`,
      relatedId: booking._id.toString(),
      timestamp: Date.now(),
    });
    
    // Send booking status changed notification with cancellation reason if applicable
    io.to(`user:${booking.user._id}`).emit('booking_status_changed', {
      bookingId: booking._id.toString(),
      serviceName: booking.service.name,
      status: booking.status,
      cancellationReason: booking.cancellationReason
    });

    // Send push notification
    try {
      await sendPushNotification(booking.user._id.toString(), {
        title: 'Booking Update',
        body: `Your booking for ${booking.service.name} has been ${status}${status === 'cancelled' && cancellationReason ? `: ${cancellationReason}` : ''}`,
        data: {
          type: 'booking_status',
          bookingId: booking._id.toString(),
        },
      });
    } catch (error) {
      logger.error('Failed to send push notification:', { error: error.message });
      // Continue even if push notification fails
    }
    
    // Send email notification about status update
    try {
      // If status is completed and receipt was generated, attach the receipt to the email
      if (status === 'completed' && booking.receiptId) {
        try {
          // Get the receipt details
          const Receipt = mongoose.model('Receipt');
          const receipt = await Receipt.findById(booking.receiptId);
          
          if (receipt) {
            logger.info('Found receipt for completed booking', { 
              receiptId: receipt._id, 
              bookingId: booking._id 
            });
            
            try {
              // Generate the receipt PDF
              const receiptPdfPath = await generateReceiptPDF(receipt, booking);
              logger.info('Generated receipt PDF successfully', { 
                receiptId: receipt._id, 
                bookingId: booking._id,
                pdfPath: receiptPdfPath
              });
              
              // Send email with receipt attachment
              const emailSent = await sendBookingStatusUpdateToCustomer(
                booking,
                booking.user.name,
                booking.user.email,
                booking.service.name,
                status,
                receiptPdfPath
              );
              
              if (emailSent) {
                logger.info('Sent status update email with receipt attachment', { 
                  receiptId: receipt._id, 
                  bookingId: booking._id,
                  userEmail: booking.user.email
                });
              } else {
                logger.warn('Failed to send status update email with receipt attachment', { 
                  receiptId: receipt._id, 
                  bookingId: booking._id,
                  userEmail: booking.user.email
                });
              }
              
              // Clean up the temporary PDF file
              cleanupReceiptPDF(receiptPdfPath);
            } catch (pdfError: any) {
              logger.error('Error generating or sending receipt PDF', { 
                error: pdfError.message, 
                stack: pdfError.stack,
                receiptId: receipt._id,
                bookingId: booking._id
              });
              
              // If PDF generation fails, send email without attachment
              await sendBookingStatusUpdateToCustomer(
                booking,
                booking.user.name,
                booking.user.email,
                booking.service.name,
                status
              );
            }
          } else {
            logger.warn('Receipt not found for completed booking', { bookingId: booking._id, receiptId: booking.receiptId });
            // If receipt not found, send email without attachment
            await sendBookingStatusUpdateToCustomer(
              booking,
              booking.user.name,
              booking.user.email,
              booking.service.name,
              status
            );
          }
        } catch (receiptError: any) {
          logger.error('Error retrieving receipt for completed booking', { 
            error: receiptError.message, 
            stack: receiptError.stack,
            bookingId: booking._id,
            receiptId: booking.receiptId
          });
          
          // If receipt retrieval fails, send email without attachment
          await sendBookingStatusUpdateToCustomer(
            booking,
            booking.user.name,
            booking.user.email,
            booking.service.name,
            status
          );
        }
      } else {
        // For other statuses, send email without attachment
        await sendBookingStatusUpdateToCustomer(
          booking,
          booking.user.name,
          booking.user.email,
          booking.service.name,
          status
        );
      }
    } catch (emailError) {
      logger.error('Failed to send status update email:', { error: emailError.message });
      // Continue even if email notification fails
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    // Log the error with details
    logger.error('Error updating booking status', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

/**
 * Cancel a booking (user can cancel their own booking)
 * @route PATCH /api/bookings/:id/cancel
 * @access Private
 */
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { cancellationReason } = req.body;
    
    // Validate cancellation reason
    if (!cancellationReason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a cancellation reason',
      });
    }
    
    // Find booking
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'name')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if the booking belongs to the current user
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
    }

    // Check if booking is already cancelled or completed
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status}`,
      });
    }

    // Update status to cancelled and set cancellation reason
    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason;
    await booking.save();

    // If user is admin, notify the customer
    if (req.user.role === 'admin') {
      // Send real-time notification via Socket.io
      io.to(`user:${booking.user._id}`).emit('notification', {
        type: 'booking_status',
        title: 'Booking Cancelled',
        message: `Your booking for ${booking.service.name} has been cancelled by the admin`,
        relatedId: booking._id.toString(),
        timestamp: Date.now(),
      });

      // Send push notification
      try {
        await sendPushNotification(booking.user._id.toString(), {
          title: 'Booking Cancelled',
          body: `Your booking for ${booking.service.name} has been cancelled by the admin`,
          data: {
            type: 'booking_status',
            bookingId: booking._id.toString(),
          },
        });
      } catch (error) {
        logger.error('Failed to send push notification:', { error: error.message });
        // Continue even if push notification fails
      }
      
      // Send email notification about cancellation
      try {
        await sendBookingStatusUpdateToCustomer(
          booking,
          booking.user.name,
          booking.user.email,
          booking.service.name,
          'cancelled'
        );
      } catch (emailError) {
        logger.error('Failed to send cancellation email:', { error: emailError.message });
        // Continue even if email notification fails
      }
    } else {
      // If user cancelled their own booking, notify admin
      io.to('admin').emit('notification', {
        type: 'booking_status',
        title: 'Booking Cancelled',
        message: `${booking.user.name} cancelled their booking for ${booking.service.name}`,
        relatedId: booking._id.toString(),
        timestamp: Date.now(),
      });
      
      // Send email notification to admin about user cancellation
      try {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
          await sendEmail({
            to: adminEmail,
            subject: `Booking Cancelled: ${booking.service.name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #dc2626; padding: 20px; text-align: center; color: white;">
                  <h1>Booking Cancellation</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
                  <p>Hello Admin,</p>
                  <p>A customer has cancelled their booking:</p>
                  <div style="background-color: #f9fafb; padding: 15px; margin: 15px 0; border-radius: 5px;">
                    <p><strong>Booking ID:</strong> ${booking._id}</p>
                    <p><strong>Service:</strong> ${booking.service.name}</p>
                    <p><strong>Customer:</strong> ${booking.user.name} (${booking.user.email})</p>
                    <p><strong>Date:</strong> ${booking.date}</p>
                    <p><strong>Time:</strong> ${booking.time}</p>
                  </div>
                  <p>Please log in to the admin dashboard for more details.</p>
                </div>
              </div>
            `
          });
        }
      } catch (emailError) {
        logger.error('Failed to send admin cancellation email:', { error: emailError.message });
        // Continue even if email notification fails
      }
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error: any) {
    // Log the error with details
    logger.error('Error cancelling booking', { error: error.message, stack: error.stack });
    
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};