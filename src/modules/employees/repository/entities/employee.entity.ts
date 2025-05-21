import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export const EmployeeDatabaseName = 'employee';

@Schema()
export class EmployeeEntity extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  middleName: string;

  @Prop({ required: true })
  gender: string;

  @Prop({ required: true })
  dob: Date;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ unique: true })
  employeeId: string;

  @Prop({ required: false })
  cadre: string;

  @Prop({ required: false })
  localGovernment: string;

  @Prop({ required: false })
  department: string;

  @Prop({ required: false })
  level: string;

  @Prop({ required: false })
  step: number;

  @Prop({ required: false })
  employmentDate: Date;

  @Prop({ required: false })
  qualification: string;

  @Prop({ required: false })
  state: string;

  @Prop({ required: false })
  address: string;

  @Prop({ required: false })
  dateOfFirstEmployment: Date;

  @Prop({ required: false })
  retirementAge: number;

  @Prop()
  transferDetails: string;

  @Prop({ required: false })
  salary: number;

  @Prop()
  dateOfPreviousPositions: Date[];

  @Prop({})
  profilePassport: string;

  @Prop({ required: false })
  dateOfPresentPosition: Date;

  @Prop({ required: false })
  staffStatus: string;

  @Prop()
  appointmentLetter: string;

  @Prop()
  relievingLetter: string;

  @Prop()
  salarySlips: string[];

  @Prop({ required: false, unique: true, sparse: true })
  nin: string;

  @Prop({ required: false })
  maritalStatus: string;

  @Prop({ required: false })
  nationality: string;

  @Prop({ required: false })
  academicQualification: string;

  @Prop({ required: false })
  designation: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(EmployeeEntity);

export type EmployeeDoc = EmployeeEntity & Document;
