import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export const ExamsDatabaseName = 'exams';

export enum examType {
  promotion = 'promotion',
  conversion = 'conversion',
  registration = 'registration',
}

@Schema()
export class ExamsEntity extends Document {
  @Prop({ })
  examDate: Date;

  @Prop({  })
  examType: examType;

  @Prop({  })
  examStatus: string;

  @Prop({  })
  generalPaperScore: number;

  @Prop({  })
  professionalPaperScore: number;

  @Prop({  })
  totalScore: number;

  @Prop({  })
  remark: string;

  @Prop({  })
  examNumber: string;
}

export const ExamsSchema = SchemaFactory.createForClass(ExamsEntity);

export type ExamsDoc = ExamsEntity & Document;
