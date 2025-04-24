import { Document } from 'mongoose';
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

  @Prop({  })
  professionalPaperScore: number;

  @Prop({})
  interviewScore: number;

  @Prop({})
  appraisalScore: number;

  @Prop({})
  seniorityScore: number;

  @Prop({ })

  @Prop({})
  totalScore: number;

  @Prop({  })
  remark: string;

  @Prop({  })
  examNumber: string;
}

export const ExamsSchema = SchemaFactory.createForClass(ExamsEntity);

export type ExamsDoc = ExamsEntity & Document;