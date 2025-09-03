import { Injectable,  Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma/prisma.service';

@Injectable()
export class CivilServantsService {
  private readonly logger = new Logger(CivilServantsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findByNin(nin: string) {
     if (!this.prisma.isAvailable()) {
      this.logger.warn('PostgreSQL not available, skipping civil servant lookup');
      return null;
     }
    
    return this.prisma.civilServant.findUnique({
      where: { nin },
      select: {
        surname: true,
        firstname: true,
        middlename: true,
        nin: true,
        passportUrl: true,
      },
    });
  }

  async findByCriteria(criteria: {
    surname?: string;
    firstname?: string;
    idCardServiceNumber?: string;
  }) {

    if (!this.prisma.isAvailable()) {
      this.logger.warn('PostgreSQL not available, skipping civil servant lookup');
      return [];
    }

    
    return this.prisma.civilServant.findMany({
      where: {
        ...(criteria.surname && { surname: { contains: criteria.surname, mode: 'insensitive' } }),
        ...(criteria.firstname && { firstname: { contains: criteria.firstname, mode: 'insensitive' } }),
        ...(criteria.idCardServiceNumber && { idCardServiceNumber: criteria.idCardServiceNumber }),
      },
      select: {
        id: true,
        surname: true,
        firstname: true,
        middlename: true,
        nin: true,
        idCardServiceNumber: true,
        passportUrl: true,
        department: true,
        currentMda: true,
        gradeLevel: true,
        cadre: true,
      },
    });
  }
}
