import mongoose, { Document, Schema } from 'mongoose';

export interface IPushSubscription extends Document {
  user: mongoose.Types.ObjectId;
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    endpoint: {
      type: String,
      required: [true, 'Endpoint is required'],
      unique: true,
    },
    expirationTime: {
      type: Number,
      default: null,
    },
    keys: {
      p256dh: {
        type: String,
        required: [true, 'P256DH key is required'],
      },
      auth: {
        type: String,
        required: [true, 'Auth key is required'],
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);