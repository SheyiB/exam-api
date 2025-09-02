import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

export const POSTGRES_POOL = 'POSTGRES_POOL';

export const postgresProviders = [
  {
    provide: POSTGRES_POOL,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService): Promise<Pool> => {
      const pool = new Pool({
        connectionString: configService.get<string>('POSTGRES_URL'),
        ssl: {
          rejectUnauthorized: false // Required for Neon and most cloud PostgreSQL providers
        },
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      });

      // Test the connection
      try {
        const client = await pool.connect();
        console.log('✅ PostgreSQL connected successfully');
        client.release();
      } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error);
        throw error;
      }

      return pool;
    },
  },
];