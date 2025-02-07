import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ErrorModule } from './error/error.module';

@Module({
  imports: [ConfigModule.forRoot(), ErrorModule],
  controllers: [],
  providers: [],
})
export class CommonModule {}
