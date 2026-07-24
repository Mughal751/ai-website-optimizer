import mongoose, { Schema, type Document, type Model, Types } from 'mongoose';
import type { ScanStatus, CategoryScores, RawResults, Recommendation } from '@/types/scan';

export interface IScan extends Document {
  userId: Types.ObjectId;
  url: string;
  status: ScanStatus;
  overallScore: number | null;
  categoryScores: CategoryScores | null;
  rawResults: Partial<RawResults> | null;
  recommendations: Recommendation[];
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

const RecommendationSchema = new Schema<Recommendation>(
  {
    category: { type: String, required: true },
    issue: { type: String, required: true },
    impact: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    effort: { type: String, enum: ['Quick win', 'Larger fix'], required: true },
    explanation: { type: String, required: true },
    fixSteps: { type: [String], default: [] }
  },
  { _id: false }
);

const ScanSchema = new Schema<IScan>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  url: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['queued', 'running', 'complete', 'failed'],
    default: 'queued',
    index: true
  },
  overallScore: { type: Number, default: null },
  categoryScores: {
    type: new Schema(
      {
        seo: Number,
        performance: Number,
        accessibility: Number,
        mobile: Number,
        security: Number,
        links: Number
      },
      { _id: false }
    ),
    default: null
  },
  // Findings vary in shape per category, so store as Mixed rather than
  // forcing a rigid embedded schema per check type.
  rawResults: { type: Schema.Types.Mixed, default: null },
  recommendations: { type: [RecommendationSchema], default: [] },
  error: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
  completedAt: { type: Date, default: null }
});

ScanSchema.index({ userId: 1, createdAt: -1 });

export const Scan: Model<IScan> =
  mongoose.models.Scan || mongoose.model<IScan>('Scan', ScanSchema);
