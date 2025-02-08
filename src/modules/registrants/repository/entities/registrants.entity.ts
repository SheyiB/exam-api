import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ExamsEntity } from 'src/modules/exams/repository/entities/exams.entity';

export const RegistrantsDatabaseName = 'registrants';

@Schema()
export class RegistrantsEntity extends Document {
  @Prop({ required: true })
  surname: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({})
  middleName: string;

  @Prop({ required: true })
  gender: string;

  @Prop({ required: true })
  presentRank: string;

  @Prop({ required: true })
  expectedRank: string;

  @Prop({ })
  dateOfPrevAppointment: Date;

  @Prop({ })
  dateOfPresentAppointment: Date;

  @Prop({  })
  dateOfFirstAppointment: Date;

  @Prop({ required: true })
  disability: boolean;

  @Prop({  })
  profilePassport: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  cadre: string;

  @Prop({ required: true })
  mda: string;

  @Prop({ })
  exam: ExamsEntity;
}

export const RegistrantsSchema =
  SchemaFactory.createForClass(RegistrantsEntity);

export type RegistrantsDoc = RegistrantsEntity & Document;
