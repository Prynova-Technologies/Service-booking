import mongoose, { Document, Schema } from 'mongoose';

export interface IOffDutyPeriod extends Document {
  startDate: Date;
  endDate: Date;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

const offDutyPeriodSchema = new Schema(
  {
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      enum: ['Holiday', 'Vacation', 'Sick Leave', 'Personal', 'Other'],
    },
  },
  { timestamps: true }
);

// Add validation to ensure end date is after start date
offDutyPeriodSchema.pre('validate', function(next) {
  if (this.startDate && this.endDate && this.startDate > this.endDate) {
    this.invalidate('endDate', 'End date must be after start date');
  }
  next();
});

const OffDutyPeriod = mongoose.model<IOffDutyPeriod>('OffDutyPeriod', offDutyPeriodSchema);

export default OffDutyPeriod;