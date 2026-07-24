import mongoose, { Schema, type Document, type Model, Types } from 'mongoose';

export type JobStatus = 'queued' | 'active' | 'completed' | 'failed';

export interface IJob extends Document {
  type: string;
  status: JobStatus;
  payload: Record<string, unknown>;
  scanId: Types.ObjectId;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>({
  type: { type: String, required: true, default: 'scan' },
  status: {
    type: String,
    enum: ['queued', 'active', 'completed', 'failed'],
    default: 'queued',
    index: true
  },
  payload: { type: Schema.Types.Mixed, default: {} },
  scanId: { type: Schema.Types.ObjectId, ref: 'Scan', required: true, index: true },
  attempts: { type: Number, default: 0 },
  lastError: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

JobSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
