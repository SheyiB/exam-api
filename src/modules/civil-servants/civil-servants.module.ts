import { Module } from '@nestjs/common';
import { CivilServantsService } from './civil-servants.service';
import { PrismaModule } from 'src/common/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CivilServantsService],
  exports: [CivilServantsService],
})
export class CivilServantsModule {}