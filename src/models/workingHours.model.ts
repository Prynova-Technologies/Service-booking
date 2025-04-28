import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkingHours extends Document {
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string; // Format: HH:MM (24-hour format)
  endTime: string; // Format: HH:MM (24-hour format)
  isWorkingDay: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const workingHoursSchema = new Schema<IWorkingHours>(
  {
    dayOfWeek: {
      type: String,
      required: true,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,  // Validates HH:MM format (24-hour)
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,  // Validates HH:MM format (24-hour)
    },
    isWorkingDay: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

// Add a compound index to ensure uniqueness of dayOfWeek
workingHoursSchema.index({ dayOfWeek: 1 }, { unique: true });

const WorkingHours = mongoose.model<IWorkingHours>('WorkingHours', workingHoursSchema);

export default WorkingHours;