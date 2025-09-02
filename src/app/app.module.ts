import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigModule and ConfigService
import { RegistrantsModule } from 'src/modules/registrants/registrants.module';
import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/modules/users/user.module';
import { ExamsModule } from 'src/modules/exams/exams.module';
import { PostgresModule } from 'src/common/database/postgres.module'; 
import { CivilServantModule } from 'src/modules/civil-servants/civil-servant.module'; 


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URL'),
      }),
      inject: [ConfigService],
    }),
    PostgresModule,
    RegistrantsModule,
    CommonModule,
    UserModule,
    ExamsModule,
    CivilServantModule,
  ],
})
export class AppModule {}
