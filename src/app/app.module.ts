import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigModule and ConfigService
import { RegistrantsModule } from 'src/modules/registrants/registrants.module';
import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/modules/users/user.module';
import { ExamsModule } from 'src/modules/exams/exams.module';
import { CivilServantsModule } from 'src/modules/civil-servants/civil-servants.module';


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
    RegistrantsModule,
    CommonModule,
    UserModule,
    ExamsModule,
    CivilServantsModule,
  ],
})
export class AppModule {}
