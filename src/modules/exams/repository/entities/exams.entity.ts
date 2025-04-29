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

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
export class ExamsEntity extends Document {
  @Prop({ })
  examDate: Date;

  @Prop({  })
  examType: examType;

  @Prop({ default: examStatus.pending })
  examStatus: string;

  @Prop({  })
  generalPaperScore: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'UserEntity' })
  generalPaperScoreUploadedBy: mongoose.Types.ObjectId;

  @Prop({  })
  professionalPaperScore: number;

   @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'UserEntity' })
  professionalPaperScoreUploadedBy: mongoose.Types.ObjectId;

  @Prop({})
  interviewScore: number;

   @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'UserEntity' })
  interviewScoreUploadedBy: mongoose.Types.ObjectId;

  @Prop({})
  appraisalScore: number;

   @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'UserEntity' })
  appraisalScoreUploadedBy: mongoose.Types.ObjectId;

  @Prop({})
  seniorityScore: number;

   @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'UserEntity' })
  seniorityScoreUploadedBy: mongoose.Types.ObjectId;

  @Prop({})
  totalScore: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'UserEntity' })
  totalScoreUploadedBy: mongoose.Types.ObjectId;

  @Prop({  })
  remark: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'UserEntity' })
  remarkUploadedBy: mongoose.Types.ObjectId;

  @Prop({  })
  examNumber: string;
}

export const ExamsSchema = SchemaFactory.createForClass(ExamsEntity);

export type ExamsDoc = ExamsEntity & Document;