import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { postgresProviders } from './postgres.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [...postgresProviders],
  exports: [...postgresProviders],
})
export class PostgresModule {}