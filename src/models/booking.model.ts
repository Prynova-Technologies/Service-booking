import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface IBooking extends Document {
  service: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  date: string;
  time: string;
  status: BookingStatus;
  startingPrice: number;
  completedPrice?: number;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    startingPrice: {
      type: Number,
      required: [true, 'Starting price is required'],
    },
    completedPrice: {
      type: Number,
    },
    address: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for faster queries
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ service: 1, date: 1 });

export default mongoose.model<IBooking>('Booking', bookingSchema);