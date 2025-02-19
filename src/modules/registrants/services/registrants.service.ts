import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { IRegistrantsService } from '../interfaces/registrants.service.interface';
import { RegistrantCreateDto } from '../dtos/registrants.create.dto';
import {
  RegistrantsDoc,
  RegistrantsEntity,
} from '../repository/entities/registrants.entity';
import {
  ENUM_REQUEST_STATUS_CODE_ERROR,
  ENUM_RESPONSE_MESSAGE,
} from 'src/common/constants';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

@Injectable()
export class RegistrantsService implements IRegistrantsService {
  constructor(
    @InjectModel(RegistrantsEntity.name)
    private registrantsModel: Model<RegistrantsDoc>,
  ) {}

  private generateExamNumber(registeredUsers: number, examType: string): string {
    let type;
    if(examType === 'registration') {
      type = 'REG';
    } else if (examType === 'conversion') {
      type = 'CON';
    }
    else {
      type = 'PROM';
    }
    const currentYear = new Date().getFullYear();
    const paddedNumber = String(registeredUsers + 1).padStart(5, '0');
    
    return `SEB/${type}/${currentYear}/${paddedNumber}`;
  }

  private getDefaultSelection() {
    return {
      surname: 1,
      firstName: 1,
      'exam.examNumber': 1,
      mda: 1,
      gender: 1,
      presentRank: 1,
      expectedRank: 1,
      'exam.remark': 1,
    };
  }

  async createRegistrants(
    registrant: RegistrantCreateDto,
  ): Promise<RegistrantsDoc> {
    const existingRegistrant = await this.registrantsModel.findOne({
      email: registrant.email,
    }).lean();

    if (existingRegistrant) {
      throw new UnprocessableEntityException({
        statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
        message: ENUM_RESPONSE_MESSAGE.REGISTRANT_EXIST,
      });
    }

    const registeredUsers = await this.registrantsModel.countDocuments();
    registrant.exam.examNumber = this.generateExamNumber(registeredUsers, registrant.exam.examType);

    const newRegistrant = new this.registrantsModel(registrant);
    return newRegistrant.save();
  }

  async updateRegistrants(
    id: string,
    registrant: Partial<RegistrantCreateDto>,
  ): Promise<RegistrantsDoc> {
    const existingRegistrant = await this.registrantsModel.findByIdAndUpdate(
      id,
      registrant,
      { new: true }
    );

    if (!existingRegistrant) {
      throw new NotFoundException({
        statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_NOT_FOUND_ERROR,
        message: ENUM_RESPONSE_MESSAGE.REGISTRANT_NOT_FOUND,
      });
    }

    return existingRegistrant;
  }

  async findAllRegistrants(query: {
    limit?: string;
    page?: string;
    [key: string]: any;
  }): Promise<PaginatedResponse<RegistrantsDoc>> {
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const page = Math.max(parseInt(query.page || '1', 10), 1);
    const skip = (page - 1) * limit;

    // Remove pagination params from query
    const { limit: _, page: __, ...filterQuery } = query;

    const [registrants, total] = await Promise.all([
      this.registrantsModel
        .find(filterQuery)
        .select(this.getDefaultSelection())
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      this.registrantsModel.countDocuments(filterQuery),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: registrants,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOneRegistrant(id: string): Promise<RegistrantsDoc> {
    const existingRegistrant = await this.registrantsModel.findById(id).lean();

    if (!existingRegistrant) {
      throw new NotFoundException({
        statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_NOT_FOUND_ERROR,
        message: ENUM_RESPONSE_MESSAGE.REGISTRANT_NOT_FOUND,
      });
    }

    return existingRegistrant;
  }

  async removeRegistrant(id: string): Promise<RegistrantsDoc> {
    const deletedRegistrant = await this.registrantsModel.findByIdAndDelete(id);

    if (!deletedRegistrant) {
      throw new NotFoundException({
        statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_NOT_FOUND_ERROR,
        message: ENUM_RESPONSE_MESSAGE.REGISTRANT_NOT_FOUND,
      });
    }

    return deletedRegistrant;
  }

  async registrantStats() {
    const [
      totalRegistrations,
      examStats,
      incapacitatedStats,
      examTypeStats,
    ] = await Promise.all([
      this.registrantsModel.countDocuments(),
      this.registrantsModel.aggregate([
        {
          $group: {
            _id: '$exam.examStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      this.registrantsModel.countDocuments({ disability: true }),
      this.registrantsModel.aggregate([
        {
          $group: {
            _id: '$exam.examType',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const examStatusMap = examStats.reduce((acc, { _id, count }) => ({
      ...acc,
      [_id]: count,
    }), {});

    const examTypeMap = examTypeStats.reduce((acc, { _id, count }) => ({
      ...acc,
      [`total${_id}Exams`]: count,
    }), {});

    return {
      totalRegistrations,
      totalPassed: examStatusMap['passed'] || 0,
      totalFailed: examStatusMap['failed'] || 0,
      totalIncapacitated: incapacitatedStats,
      ...examTypeMap,
    };
  }

  async registrantByPromotion() {
    const promotionResults = await this.registrantsModel.aggregate([
      {
        $match: {
          'exam.examStatus': 'passed',
        },
      },
      {
        $group: {
          _id: {
            presentRank: '$presentRank',
            expectedRank: '$expectedRank',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    return promotionResults.reduce((acc, { _id, count }) => ({
      ...acc,
      [`level${_id.presentRank.split(' ')[1]}_${_id.expectedRank.split(' ')[1]}`]: count,
    }), {});
  }

  async getRegistrantsByStatus(status: 'passed' | 'failed' | 'incapacitated') {
    const query = status === 'incapacitated' 
      ? { disability: true }
      : { 'exam.examStatus': status };

    return this.registrantsModel
      .find(query)
      .select(this.getDefaultSelection())
      .lean();
  }
}