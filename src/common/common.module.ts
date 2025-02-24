import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ErrorModule } from './error/error.module';
import { HelperModule } from './helper/helper.module';

@Module({
  imports: [ConfigModule.forRoot(), ErrorModule, HelperModule],
  controllers: [],
  providers: [],
})
export class CommonModule {}
