import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export const ExamsDatabaseName = 'exams';

enum examType {
  promotion = 'promotion',
  conversion = 'conversion',
  registration = 'registration',
}

@Schema()
export class ExamsEntity extends Document {
  @Prop({ required: true })
  examDate: Date;

  @Prop({ required: true })
  examType: examType;

  @Prop({ required: true })
  examStatus: string;

  @Prop({ required: true })
  generalPaperScore: number;

  @Prop({ required: true })
  professionalPaperScore: number;

  @Prop({ required: true })
  totalScore: number;

  @Prop({ required: true })
  remark: string;

  @Prop({ required: true })
  examNumber: string;
}

export const ExamsSchema = SchemaFactory.createForClass(ExamsEntity);

export type ExamsDoc = ExamsEntity & Document;
