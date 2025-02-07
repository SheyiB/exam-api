import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegistrantsController } from './controllers/registrants.controller';
import { RegistrantsService } from './services/registrants.service';
import {
  RegistrantsEntity,
  RegistrantsSchema,
} from './repository/entities/registrants.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RegistrantsEntity.name, schema: RegistrantsSchema },
    ]),
  ],
  controllers: [RegistrantsController],
  providers: [RegistrantsService],
})
export class RegistrantsModule {}
