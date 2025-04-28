import nodemailer from 'nodemailer';
import { IBooking } from '../models/booking.model';
import logger from './logger';

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized?: boolean;
  };
}

// Email data interface
interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    path: string;
  }[];
}

/**
 * Create a nodemailer transporter using the environment variables
 */
const createTransporter = () => {
  const config: EmailConfig = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    }
  };

  return nodemailer.createTransport(config);
};

/**
 * Send an email using nodemailer
 * @param emailData The email data to send
 */
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // Create transporter
    const transporter = createTransporter();

    // Send email
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM || 'noreply@example.com'}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      attachments: emailData.attachments || []
    });

    logger.info('Email sent successfully', { to: emailData.to, subject: emailData.subject });
    return true;
  } catch (error: any) {
    logger.error('Failed to send email', { error: error.message, stack: error.stack });
    return false;
  }
};

/**
 * Generate HTML template for booking confirmation email to admin
 * @param booking The booking data
 * @param userName The name of the user who made the booking
 * @param userEmail The email of the user who made the booking
 * @param serviceName The name of the service booked
 */
const generateAdminBookingEmailTemplate = (
  booking: IBooking,
  userName: string,
  userEmail: string,
  serviceName: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center; color: white;">
        <h1>New Booking Notification</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hello Admin,</p>
        <p>A new booking has been created with the following details:</p>
        <div style="background-color: #f9fafb; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <p><strong>Booking ID:</strong> ${booking._id}</p>
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Customer:</strong> ${userName} (${userEmail})</p>
          <p><strong>Date:</strong> ${booking.date}</p>
          <p><strong>Time:</strong> ${booking.time}</p>
          <p><strong>Starting Price:</strong> $${booking.startingPrice}</p>
          ${booking.address ? `<p><strong>Address:</strong> ${booking.address}</p>` : ''}
          ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
        </div>
        <p>Please log in to the admin dashboard to manage this booking.</p>
        <p>Thank you,<br>Rashad Services Team</p>
      </div>
      <div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>This is an automated email, please do not reply.</p>
      </div>
    </div>
  `;
};

/**
 * Generate HTML template for booking confirmation email to customer
 * @param booking The booking data
 * @param userName The name of the user who made the booking
 * @param serviceName The name of the service booked
 */
const generateCustomerBookingEmailTemplate = (
  booking: IBooking,
  userName: string,
  serviceName: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4f46e5; padding: 20px; text-align: center; color: white;">
        <h1>Booking Confirmation</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hello ${userName},</p>
        <p>Thank you for booking with us. Your booking has been received and is currently <strong>pending confirmation</strong>.</p>
        <div style="background-color: #f9fafb; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <p><strong>Booking ID:</strong> ${booking._id}</p>
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Date:</strong> ${booking.date}</p>
          <p><strong>Time:</strong> ${booking.time}</p>
          <p><strong>Starting Price:</strong> $${booking.startingPrice}</p>
          ${booking.address ? `<p><strong>Address:</strong> ${booking.address}</p>` : ''}
          ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
        </div>
        <p>We will notify you once your booking is confirmed. You can also check the status of your booking in your account dashboard.</p>
        <p>Thank you for choosing our services!</p>
        <p>Best regards,<br>Rashad Services Team</p>
      </div>
      <div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>This is an automated email, please do not reply.</p>
      </div>
    </div>
  `;
};

/**
 * Send booking confirmation email to admin
 * @param booking The booking data
 * @param userName The name of the user who made the booking
 * @param userEmail The email of the user who made the booking
 * @param serviceName The name of the service booked
 */
export const sendBookingNotificationToAdmin = async (
  booking: IBooking,
  userName: string,
  userEmail: string,
  serviceName: string
): Promise<boolean> => {
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    logger.error('Admin email not configured');
    return false;
  }

  const emailData: EmailData = {
    to: adminEmail,
    subject: `New Booking: ${serviceName}`,
    html: generateAdminBookingEmailTemplate(booking, userName, userEmail, serviceName)
  };

  return sendEmail(emailData);
};

/**
 * Send booking confirmation email to customer
 * @param booking The booking data
 * @param userName The name of the user who made the booking
 * @param userEmail The email of the user who made the booking
 * @param serviceName The name of the service booked
 */
export const sendBookingConfirmationToCustomer = async (
  booking: IBooking,
  userName: string,
  userEmail: string,
  serviceName: string
): Promise<boolean> => {
  if (!userEmail) {
    logger.error('Customer email not available');
    return false;
  }

  const emailData: EmailData = {
    to: userEmail,
    subject: `Booking Confirmation: ${serviceName}`,
    html: generateCustomerBookingEmailTemplate(booking, userName, serviceName)
  };

  return sendEmail(emailData);
};

/**
 * Generate HTML template for booking status update email to customer
 * @param booking The booking data
 * @param userName The name of the user who made the booking
 * @param serviceName The name of the service booked
 * @param status The new status of the booking
 */
const generateStatusUpdateEmailTemplate = (
  booking: IBooking,
  userName: string,
  serviceName: string,
  status: string
): string => {
  let statusMessage = '';
  let statusColor = '';
  let additionalContent = '';
  
  switch (status) {
    case 'confirmed':
      statusMessage = 'Your booking has been confirmed and is scheduled as requested.';
      statusColor = '#16a34a'; // green
      break;
    case 'completed':
      statusMessage = 'Your service has been completed. Thank you for choosing our services!';
      statusColor = '#2563eb'; // blue
      additionalContent = `
        <div style="background-color: #dbeafe; border: 1px solid #93c5fd; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <p style="margin-top: 0;"><strong>📎 Receipt Attached</strong></p>
          <p style="margin-bottom: 0;">We've attached an official receipt to this email for your records. Please save it for your tax and warranty purposes.</p>
        </div>
      `;
      break;
    case 'cancelled':
      statusMessage = 'Your booking has been cancelled. If you did not request this cancellation, please contact us.';
      statusColor = '#dc2626'; // red
      break;
    default:
      statusMessage = `Your booking status has been updated to: ${status}.`;
      statusColor = '#4f46e5'; // indigo
  }
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${statusColor}; padding: 20px; text-align: center; color: white;">
        <h1>Booking Status Update</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hello ${userName},</p>
        <p>${statusMessage}</p>
        ${additionalContent}
        <div style="background-color: #f9fafb; padding: 15px; margin: 15px 0; border-radius: 5px;">
          <p><strong>Booking ID:</strong> ${booking._id}</p>
          <p><strong>Service:</strong> ${serviceName}</p>
          <p><strong>Date:</strong> ${booking.date}</p>
          <p><strong>Time:</strong> ${booking.time}</p>
          <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status.charAt(0).toUpperCase() + status.slice(1)}</span></p>
          ${booking.completedPrice ? `<p><strong>Final Price:</strong> $${booking.completedPrice}</p>` : `<p><strong>Starting Price:</strong> $${booking.startingPrice}</p>`}
        </div>
        <p>You can view the details of your booking in your account dashboard.</p>
        <p>Thank you for choosing our services!</p>
        <p>Best regards,<br>Rashad Services Team</p>
      </div>
      <div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>This is an automated email, please do not reply.</p>
      </div>
    </div>
  `;
};

/**
 * Send booking status update email to customer
 * @param booking The booking data
 * @param userName The name of the user who made the booking
 * @param userEmail The email of the user who made the booking
 * @param serviceName The name of the service booked
 * @param status The new status of the booking
 * @param receiptPath Optional path to receipt PDF to attach
 */
export const sendBookingStatusUpdateToCustomer = async (
  booking: IBooking,
  userName: string,
  userEmail: string,
  serviceName: string,
  status: string,
  receiptPath?: string
): Promise<boolean> => {
  if (!userEmail) {
    logger.error('Customer email not available');
    return false;
  }

  const statusCapitalized = status.charAt(0).toUpperCase() + status.slice(1);
  
  const emailData: EmailData = {
    to: userEmail,
    subject: `Booking ${statusCapitalized}: ${serviceName}`,
    html: generateStatusUpdateEmailTemplate(booking, userName, serviceName, status)
  };

  // Attach receipt PDF if provided and status is completed
  if (receiptPath && status === 'completed') {
    emailData.attachments = [
      {
        filename: `${serviceName.replace(/\s+/g, '_')}_Receipt_${new Date().toISOString().split('T')[0]}.pdf`,
        path: receiptPath
      }
    ];
    
    logger.info('Attaching receipt PDF to email', { 
      bookingId: booking._id,
      receiptPath: receiptPath,
      userEmail: userEmail
    });
  }

  return sendEmail(emailData);
};