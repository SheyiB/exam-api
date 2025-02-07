import * as mongoose from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { DB_PVD } from './database.constant';

export const databaseProviders = [
  {
    provide: DB_PVD,
    inject: [ConfigService], // Inject ConfigService
    useFactory: async (
      configService: ConfigService,
    ): Promise<typeof mongoose> => {
      const dbUrl = configService.get<string>('DB_URL'); // Get DB_URL from environment variables
      return mongoose.connect(dbUrl); // Connect to MongoDB using the retrieved URL
    },
  },
];
