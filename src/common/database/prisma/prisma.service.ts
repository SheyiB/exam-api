import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService implements OnModuleInit {
  private prismaClient: any = null;
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const databaseUrl = this.configService.get('DATABASE_URL');
    
    if (!databaseUrl) {
      this.logger.warn('DATABASE_URL not found. PostgreSQL features will be disabled.');
      return;
    }

    try {
      // Dynamic import to avoid initialization errors
      const { PrismaClient } = await import('@prisma/client');
      this.prismaClient = new PrismaClient({
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
      });
      
      await this.prismaClient.$connect();
      this.isConnected = true;
      this.logger.log('PostgreSQL connected successfully via Prisma');
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL:', error.message);
      this.logger.warn('PostgreSQL features will be disabled');
    }
  }

  async onModuleDestroy() {
    if (this.prismaClient && this.isConnected) {
      await this.prismaClient.$disconnect();
    }
  }

  get civilServant() {
    if (!this.isConnected || !this.prismaClient) {
      throw new Error('PostgreSQL connection not available');
    }
    return this.prismaClient.civilServant;
  }

  isAvailable(): boolean {
    return this.isConnected && this.prismaClient !== null;
  }
}
