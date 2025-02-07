import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export const UserDatabaseName = 'user';

@Schema()
export class UserEntity extends Document {
  @Prop({ required: true })
  fullname: string;

  @Prop({ required: true })
  department: string;

  @Prop({ required: true })
  jobTitle: string;

  @Prop({ required: true, unique: true })
  workEmailAddress: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  employeeId: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: null })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);

export type UserDoc = UserEntity & Document;
