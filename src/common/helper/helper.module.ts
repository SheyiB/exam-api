import { Global, Module } from '@nestjs/common';
import { HelperStringService } from './services/helper.string.service';

@Global()
@Module({
  providers: [HelperStringService],
  exports: [HelperStringService],
})

export class HelperModule {}