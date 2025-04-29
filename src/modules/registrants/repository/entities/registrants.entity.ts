import mongoose, { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ExamsEntity } from 'src/modules/exams/repository/entities/exams.entity';

export const RegistrantsDatabaseName = 'registrants';

@Schema()
export class Qualification extends Document {
  @Prop({ required: true })
  qualification: string;

  @Prop({ required: true })
  dateOfQualification: Date;
}

@Schema({ timestamps: true })
export class RegistrantsEntity extends Document {
  @Prop({ required: true })
  surname: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({})
  middleName: string;

  @Prop({})
  dateOfBirth: Date;

  @Prop({})
  staffVerificationNumber: string;

  @Prop({ required: true })
  gender: string;

  @Prop({ required: true })
  presentRank: string;

  @Prop({})
  expectedRank: string;

  @Prop({})
  presentGradeLevel: string;

  @Prop({ })
  presentStep: string;

  @Prop({})
  expectedGradeLevel: string;

  @Prop({ })
  dateOfPrevAppointment: Date;

  @Prop({})
  dateOfConfirmation: Date;

  @Prop({ })
  dateOfPresentAppointment: Date;

  @Prop({  })
  dateOfFirstAppointment: Date;

  @Prop({ required: true })
  disability: boolean;

  @Prop({})
  qualifications: Qualification[];

  @Prop({  })
  profilePassport: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  nin: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  cadre: string;

  @Prop({ required: true })
  mda: string;

 @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ExamsEntity' })
  exam: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const RegistrantsSchema =
  SchemaFactory.createForClass(RegistrantsEntity);

export type RegistrantsDoc = RegistrantsEntity & Document;
