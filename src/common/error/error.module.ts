import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ErrorHttpFilter } from './filters/error.http.filter';
//import { ErrorMetaGuard } from './guards/error/meta.guard';
//import { SentryModule } from "@ntegral/nestjs-sentry";
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { ENUM_APP_ENVIRONMENT } from 'src/app/constants/app.enu.constant';
//import { DebuggerModule } from '../debugger/debugger.module';

@Module({
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ErrorHttpFilter,
    },
  ],
})
export class ErrorModule {}
