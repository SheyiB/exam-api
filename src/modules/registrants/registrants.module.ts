import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegistrantsController } from './controllers/registrants.controller';
import { RegistrantsService } from './services/registrants.service';
import {
  RegistrantsEntity,
  RegistrantsSchema,
} from './repository/entities/registrants.entity';
import { ExamsModule } from '../exams/exams.module';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { ExamsEntity, ExamsSchema } from '../exams/repository/entities/exams.entity';
import { EmployeeEntity, EmployeeSchema } from '../employees/repository/entities/employee.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RegistrantsEntity.name, schema: RegistrantsSchema },
      { name: ExamsEntity.name, schema: ExamsSchema }, 
      { name: EmployeeEntity.name, schema: EmployeeSchema },
    ]),
    CloudinaryModule,
    ExamsModule,
  ],
  controllers: [RegistrantsController],
  providers: [RegistrantsService],
})
export class RegistrantsModule {}
