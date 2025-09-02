import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { databaseProviders } from './database.provider';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
  ],
  providers: [...databaseProviders],
  exports: [...databaseProviders, PrismaModule],
})
export class DatabaseModule {}