
import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { examType } from './exams.entity';

@Schema({
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
export class ExamPassScore extends Document {
  @Prop({ required: true, unique: true })
  examType: examType;

  @Prop({ required: true })
  passScore: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: null })
  updatedAt: Date;
}

export const ExamPassScoreSchema = SchemaFactory.createForClass(ExamPassScore);

export type ExamPassScoreDoc = ExamPassScore & Document;
export const ExamPassScoreDatabaseName = 'exam_pass_scores';