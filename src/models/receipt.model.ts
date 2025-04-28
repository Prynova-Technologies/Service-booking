import mongoose, { Document, Schema } from 'mongoose';

export interface IReceipt extends Document {
  booking: mongoose.Types.ObjectId;
  finalPrice: number;
  servicePersonnelName: string;
  completionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const receiptSchema = new Schema<IReceipt>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking is required'],
    },
    finalPrice: {
      type: Number,
      required: [true, 'Final price is required'],
    },
    servicePersonnelName: {
      type: String,
      required: [true, 'Service personnel name is required'],
    },
    completionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for faster queries
receiptSchema.index({ booking: 1 });

export default mongoose.model<IReceipt>('Receipt', receiptSchema);