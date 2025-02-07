import { Document } from 'mongoose';

export interface IExams extends Document {
  // Add your interface properties here
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
