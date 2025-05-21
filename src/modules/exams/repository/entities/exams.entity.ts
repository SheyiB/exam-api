import mongoose, { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export const ExamsDatabaseName = 'exams';

export enum examType {
  promotion = 'promotion',
  conversion = 'conversion',
  confirmation = 'confirmation',
}

export enum examStatus {
  passed = 'passed',
  failed = 'failed',
  pending = 'pending'
}

// Interface for tracking score update history
interface ScoreEntry {
  score: number;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

// Schema for the score entry
const ScoreEntrySchema = new mongoose.Schema({
  score: { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserEntity' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
export class ExamsEntity extends Document {
  @Prop({})
  examDate: Date;

  @Prop({})
  examType: examType;

  @Prop({ default: examStatus.pending })
  examStatus: string;

  // General Paper Score with trail
  @Prop({ type: [ScoreEntrySchema], default: [] })
  generalPaperScoreTrail: ScoreEntry[];

  // Professional Paper Score with trail
  @Prop({ type: [ScoreEntrySchema], default: [] })
  professionalPaperScoreTrail: ScoreEntry[];

  // Interview Score with trail
  @Prop({ type: [ScoreEntrySchema], default: [] })
  interviewScoreTrail: ScoreEntry[];

  // Appraisal Score with trail
  @Prop({ type: [ScoreEntrySchema], default: [] })
  appraisalScoreTrail: ScoreEntry[];

  // Seniority Score with trail
  @Prop({ type: [ScoreEntrySchema], default: [] })
  seniorityScoreTrail: ScoreEntry[];

  // Total Score with trail
  @Prop({ type: [ScoreEntrySchema], default: [] })
  totalScoreTrail: ScoreEntry[];

  // Remark with trail
  @Prop({ type: [{
    remark: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserEntity' },
    uploadedAt: { type: Date, default: Date.now }
  }], default: [] })
  remarkTrail: {
    remark: string;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
  }[];

  @Prop({})
  examNumber: string;

  // Virtual getters for the most recent scores
  get generalPaperScore(): number | undefined {
    const trail = this.generalPaperScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].score : undefined;
  }

  get generalPaperScoreUploadedBy(): mongoose.Types.ObjectId | undefined {
    const trail = this.generalPaperScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].uploadedBy : undefined;
  }

  get generalPaperScoreUploadedAt(): Date | undefined {
    const trail = this.generalPaperScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].uploadedAt : undefined;
  }

  get professionalPaperScore(): number | undefined {
    const trail = this.professionalPaperScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].score : undefined;
  }

  get professionalPaperScoreUploadedBy(): mongoose.Types.ObjectId | undefined {
    const trail = this.professionalPaperScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].uploadedBy : undefined;
  }

  get professionalPaperScoreUploadedAt(): Date | undefined {
    const trail = this.professionalPaperScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].uploadedAt : undefined;
  }

  get interviewScore(): number | undefined {
    const trail = this.interviewScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].score : undefined;
  }

  get interviewScoreUploadedBy(): mongoose.Types.ObjectId | undefined {
    const trail = this.interviewScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].uploadedBy : undefined;
  }

  get interviewScoreUploadedAt(): Date | undefined {
    const trail = this.interviewScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].uploadedAt : undefined;
  }

  get appraisalScore(): number | undefined {
    const trail = this.appraisalScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].score : undefined;
  }

  get appraisalScoreUploadedBy(): mongoose.Types.ObjectId | undefined {
    const trail = this.appraisalScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].uploadedBy : undefined;
  }

  get appraisalScoreUploadedAt(): Date | undefined {
    const trail = this.appraisalScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].uploadedAt : undefined;
  }

  get seniorityScore(): number | undefined {
    const trail = this.seniorityScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].score : undefined;
  }

  get seniorityScoreUploadedBy(): mongoose.Types.ObjectId | undefined {
    const trail = this.seniorityScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].uploadedBy : undefined;
  }

  get seniorityScoreUploadedAt(): Date | undefined {
    const trail = this.seniorityScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].uploadedAt : undefined;
  }

  get totalScore(): number | undefined {
    const trail = this.totalScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].score : undefined;
  }

  get totalScoreUploadedBy(): mongoose.Types.ObjectId | undefined {
    const trail = this.totalScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].uploadedBy : undefined;
  }

  get totalScoreUploadedAt(): Date | undefined {
    const trail = this.totalScoreTrail;
    return trail.length > 0 ? trail[trail.length - 1].uploadedAt : undefined;
  }

  get remark(): string | undefined {
    const trail = this.remarkTrail;
    return trail.length > 0 ? trail[trail.length - 1].remark : undefined;
  }

  get remarkUploadedBy(): mongoose.Types.ObjectId | undefined {
    const trail = this.remarkTrail;
    return trail.length > 0 ? trail[trail.length - 1].uploadedBy : undefined;
  }

  get remarkUploadedAt(): Date | undefined {
    const trail = this.remarkTrail;
    return trail.length > 0 ? trail[trail.length - 1].uploadedAt : undefined;
  }
}

export const ExamsSchema = SchemaFactory.createForClass(ExamsEntity);

// Add these virtual getters to the schema
// This ensures they're included when converting to JSON/Object
ExamsSchema.virtual('generalPaperScore');
ExamsSchema.virtual('generalPaperScoreUploadedBy');
ExamsSchema.virtual('generalPaperScoreUploadedAt');

ExamsSchema.virtual('professionalPaperScore');
ExamsSchema.virtual('professionalPaperScoreUploadedBy');
ExamsSchema.virtual('professionalPaperScoreUploadedAt');

ExamsSchema.virtual('interviewScore');
ExamsSchema.virtual('interviewScoreUploadedBy');
ExamsSchema.virtual('interviewScoreUploadedAt');

ExamsSchema.virtual('appraisalScore');
ExamsSchema.virtual('appraisalScoreUploadedBy');
ExamsSchema.virtual('appraisalScoreUploadedAt');

ExamsSchema.virtual('seniorityScore');
ExamsSchema.virtual('seniorityScoreUploadedBy');
ExamsSchema.virtual('seniorityScoreUploadedAt');

ExamsSchema.virtual('totalScore');
ExamsSchema.virtual('totalScoreUploadedBy');
ExamsSchema.virtual('totalScoreUploadedAt');

ExamsSchema.virtual('remark');
ExamsSchema.virtual('remarkUploadedBy');
ExamsSchema.virtual('remarkUploadedAt');

export type ExamsDoc = ExamsEntity & Document;