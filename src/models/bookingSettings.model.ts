import mongoose, { Document, Schema } from 'mongoose';

export interface IBookingSettings extends Document {
  maxBookingsPerDay: number;
  timeBufferMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSettingsSchema = new Schema<IBookingSettings>(
  {
    maxBookingsPerDay: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
    },
    timeBufferMinutes: {
      type: Number,
      required: true,
      default: 60,
      min: 0,
    },
  },
  { timestamps: true }
);

const BookingSettings = mongoose.model<IBookingSettings>('BookingSettings', bookingSettingsSchema);

export default BookingSettings;