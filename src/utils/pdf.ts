import PDFDocument from 'pdfkit';
import { IReceipt } from '../models/receipt.model';
import { IBooking } from '../models/booking.model';
import fs from 'fs';
import path from 'path';
import logger from './logger';

/**
 * Generate a PDF receipt for a completed booking
 * @param receipt The receipt data
 * @param booking The booking data
 * @returns The path to the generated PDF file
 */
export const generateReceiptPDF = async (
  receipt: IReceipt,
  booking: IBooking
): Promise<string> => {
  try {
    // Create a temporary directory for receipts if it doesn't exist
    const tempDir = path.join(__dirname, '../../temp/receipts');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create a unique filename for the receipt
    const filename = `receipt_${receipt._id}_${Date.now()}.pdf`;
    const filePath = path.join(tempDir, filename);

    // Create a new PDF document
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Receipt - ${booking.service.name}`,
        Author: 'Rashad Services',
        Subject: 'Service Receipt',
        Keywords: 'receipt, service, booking',
        Creator: 'Rashad Services App'
      }
    });

    // Pipe the PDF to a file
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add company logo/header with styling
    doc.rect(0, 0, doc.page.width, 120).fill('#4f46e5');
    doc.fill('#FFFFFF').fontSize(28).font('Helvetica-Bold').text('Rashad Services', 50, 50, { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('Official Receipt', 50, 85, { align: 'center' });
    doc.moveDown(2);

    // Add receipt information in a styled box
    doc.roundedRect(50, 140, doc.page.width - 100, 80, 5).fillAndStroke('#f3f4f6', '#e5e7eb');
    doc.fill('#111827').fontSize(12).font('Helvetica-Bold').text('Receipt Information', 70, 155);
    doc.fontSize(10).font('Helvetica').text(`Receipt ID: ${receipt._id}`, 70, 175);
    doc.text(`Date: ${new Date(receipt.completionDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`, 70, 195);
    doc.text(`Service Personnel: ${receipt.servicePersonnelName}`, 300, 175);

    // Add booking details in a styled box
    doc.roundedRect(50, 240, doc.page.width - 100, 100, 5).fillAndStroke('#f3f4f6', '#e5e7eb');
    doc.fill('#111827').fontSize(12).font('Helvetica-Bold').text('Service Details', 70, 255);
    doc.fontSize(10).font('Helvetica').text(`Service: ${booking.service.name}`, 70, 275);
    doc.text(`Date: ${booking.date}`, 70, 295);
    doc.text(`Time: ${booking.time}`, 70, 315);
    doc.text(`Booking ID: ${booking._id}`, 300, 275);
    if (booking.address) {
      doc.text(`Location: ${booking.address}`, 300, 295);
    }

    // Add customer details in a styled box
    doc.roundedRect(50, 360, doc.page.width - 100, 80, 5).fillAndStroke('#f3f4f6', '#e5e7eb');
    doc.fill('#111827').fontSize(12).font('Helvetica-Bold').text('Customer Information', 70, 375);
    doc.fontSize(10).font('Helvetica').text(`Name: ${booking.user.name}`, 70, 395);
    doc.text(`Email: ${booking.user.email}`, 70, 415);
    if (booking.user.phone) {
      doc.text(`Phone: ${booking.user.phone}`, 300, 395);
    }

    // Add payment details in a highlighted box
    doc.roundedRect(50, 460, doc.page.width - 100, 100, 5).fillAndStroke('#f0fdf4', '#dcfce7');
    doc.fill('#111827').fontSize(12).font('Helvetica-Bold').text('Payment Summary', 70, 475);
    doc.fontSize(10).font('Helvetica').text(`Starting Price:`, 70, 495);
    doc.text(`$${booking.startingPrice.toFixed(2)}`, 300, 495, { align: 'right' });
    
    // Add any notes or adjustments if needed
    if (booking.notes) {
      doc.text(`Notes: ${booking.notes}`, 70, 515);
    }
    
    // Add a line for visual separation
    doc.moveTo(70, 535).lineTo(doc.page.width - 70, 535).stroke();
    
    // Add the final price with emphasis
    doc.fontSize(12).font('Helvetica-Bold').text('Final Price:', 70, 545);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#16a34a')
      .text(`$${receipt.finalPrice.toFixed(2)}`, 300, 545, { align: 'right' });

    // Add footer with contact information
    doc.fillColor('#4b5563').fontSize(10).font('Helvetica')
      .text('Thank you for choosing Rashad Services!', 50, doc.page.height - 100, { align: 'center' });
    doc.fontSize(8)
      .text('For questions about this receipt, please contact support@rashadservices.com', 50, doc.page.height - 80, { align: 'center' });
    doc.fontSize(8)
      .text('This is an automatically generated receipt. Please keep for your records.', 50, doc.page.height - 60, { align: 'center' });

    // Add page numbers
    doc.fontSize(8).text('Page 1 of 1', doc.page.width - 100, doc.page.height - 50, { align: 'right' });

    // Finalize the PDF and end the stream
    doc.end();

    // Return a promise that resolves when the stream is finished
    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(filePath);
      });
      stream.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error: any) {
    logger.error('Error generating receipt PDF', { error: error.message, stack: error.stack });
    throw error;
  }
};

/**
 * Clean up temporary receipt PDF files
 * @param filePath The path to the PDF file to delete
 */
export const cleanupReceiptPDF = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error: any) {
    logger.error('Error cleaning up receipt PDF', { error: error.message, stack: error.stack });
  }
};