import { Module } from '@nestjs/common';
import { CivilServantService } from './civil-servant.service';

@Module({
  providers: [CivilServantService],
  exports: [CivilServantService],
})
export class CivilServantModule {}