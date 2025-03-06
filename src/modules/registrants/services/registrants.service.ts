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
import { examType, examStatus } from '../../exams/repository/entities/exams.entity';

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

  private generateExamNumber(registeredUsers: number, registrantExamType: string): string {
    let type;
    if(registrantExamType === examType.confirmation) {
      type = 'CONF';
    } else if (registrantExamType === examType.conversion) {
      type = 'CONV';
    } else if (registrantExamType === examType.promotion) {
      type = 'PROM';
    } else {
      throw new UnprocessableEntityException({
        statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
        message: ENUM_RESPONSE_MESSAGE.INVALID_EXAM_TYPE,
      });
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
      'exam.examType': 1,
      'exam.generalPaperScore': 1,
      'exam.professionalPaperScore': 1,
      'exam.totalScore': 1,
      'exam.examStatus': 1,
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
    
    // Note: We don't need to manually set the examStatus as the pre-save middleware will handle it

    const newRegistrant = new this.registrantsModel(registrant);
    return newRegistrant.save();
  }

  async updateRegistrants(
    id: string,
    registrant: Partial<RegistrantCreateDto>,
  ): Promise<RegistrantsDoc> {
    // The pre-update middleware will automatically update the examStatus based on scores
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
    search?: string;
    [key: string]: any;
  }): Promise<PaginatedResponse<RegistrantsDoc>> {
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const page = Math.max(parseInt(query.page || '1', 10), 1);
    const skip = (page - 1) * limit;

    // Remove pagination and search params from query
    const { limit: _, page: __, search, ...filterQuery } = query;

    // Build search query if search parameter is provided
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { surname: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { middleName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { staffVerificationNumber: { $regex: search, $options: 'i' } },
          { mda: { $regex: search, $options: 'i' } },
          { presentRank: { $regex: search, $options: 'i' } },
          { expectedRank: { $regex: search, $options: 'i' } },
          { cadre: { $regex: search, $options: 'i' } },
          { 'exam.examNumber': { $regex: search, $options: 'i' } },
          { 'exam.examType': { $regex: search, $options: 'i' } },
          { 'exam.examStatus': { $regex: search, $options: 'i' } },
          { 'exam.remark': { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Combine search query with other filters
    const finalQuery = search ? { ...searchQuery, ...filterQuery } : filterQuery;

    const [registrants, total] = await Promise.all([
      this.registrantsModel
        .find(finalQuery)
        .select(this.getDefaultSelection())
        .sort({ createdAt: -1 }) // Latest first
        .limit(limit)
        .skip(skip)
        .lean(),
      this.registrantsModel.countDocuments(finalQuery),
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
      totalPassed: examStatusMap[examStatus.passed] || 0,
      totalFailed: examStatusMap[examStatus.failed] || 0,
      totalPending: examStatusMap[examStatus.pending] || 0,
      totalIncapacitated: incapacitatedStats,
      ...examTypeMap,
    };
  }

  async registrantByPromotion() {
    const promotionResults = await this.registrantsModel.aggregate([
      {
        $match: {
          'exam.examStatus': examStatus.passed,
          'exam.examType': examType.promotion,
        },
      },
      {
        $group: {
          _id: {
            expectedRank: '$expectedRank',
            presentRank: '$presentRank',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const rankRange = Array.from({ length: 15 }, (_, i) => ({
      presentRank: i + 1,
      expectedRank: i + 2,
    }));

    const statsMap = promotionResults.reduce((acc, { _id, count }) => {
      const key = `${_id.presentRank}-${_id.expectedRank}`;
      acc[key] = count;
      return acc;
    }, {});

    const stats = rankRange.map(({ presentRank, expectedRank }) => ({
      presentRank,
      expectedRank,
      count: statsMap[`${presentRank}-${expectedRank}`] || 0,
    }));

    return stats;
  }

  async getRegistrantsByStatus(
    status: 'passed' | 'failed' | 'pending' | 'incapacitated',
    query: { limit?: string; page?: string; search?: string; [key: string]: any }
  ): Promise<PaginatedResponse<RegistrantsDoc>> {
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const page = Math.max(parseInt(query.page || '1', 10), 1);
    const skip = (page - 1) * limit;

    const statusQuery = status === 'incapacitated'
      ? { disability: true }
      : { 'exam.examStatus': status };

    // Remove pagination and search params from query
    const { limit: _, page: __, search, ...filterQuery } = query;

    // Build search query if search parameter is provided
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { surname: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { middleName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { staffVerificationNumber: { $regex: search, $options: 'i' } },
          { mda: { $regex: search, $options: 'i' } },
          { presentRank: { $regex: search, $options: 'i' } },
          { expectedRank: { $regex: search, $options: 'i' } },
          { cadre: { $regex: search, $options: 'i' } },
          { 'exam.examNumber': { $regex: search, $options: 'i' } },
          { 'exam.examType': { $regex: search, $options: 'i' } },
          { 'exam.remark': { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Combine status query, search query and other filters
    const finalQuery = search 
      ? { ...statusQuery, ...searchQuery, ...filterQuery } 
      : { ...statusQuery, ...filterQuery };

    const [registrants, total] = await Promise.all([
      this.registrantsModel
        .find(finalQuery)
        .select(this.getDefaultSelection())
        .sort({ createdAt: -1 }) // Latest first
        .limit(limit)
        .skip(skip)
        .lean(),
      this.registrantsModel.countDocuments(finalQuery),
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

  async getExamStatusByLevel() {
    // Get pass, fail, and pending counts for each level (present rank)
    const examStatusByLevel = await this.registrantsModel.aggregate([
      {
        $group: {
          _id: '$presentRank',
          passed: {
            $sum: {
              $cond: [{ $eq: ['$exam.examStatus', examStatus.passed] }, 1, 0],
            },
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ['$exam.examStatus', examStatus.failed] }, 1, 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$exam.examStatus', examStatus.pending] }, 1, 0],
            },
          },
        },
      },
    ]);

    const stats = examStatusByLevel.map(({ _id, passed, failed, pending }) => ({
      level: _id,
      passed,
      failed,
      pending,
    })).sort(
      (a, b) => {
        if (a.level < b.level) {
          return -1;
        }
        if (a.level > b.level) {
          return 1;
        }
        return 0;
      }
    );

    return stats;
  }

  // New method to get average scores by exam type
  async getAverageScoresByExamType() {
    const averageScores = await this.registrantsModel.aggregate([
      {
        $match: {
          'exam.generalPaperScore': { $exists: true },
          'exam.professionalPaperScore': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$exam.examType',
          avgGeneralScore: { $avg: '$exam.generalPaperScore' },
          avgProfessionalScore: { $avg: '$exam.professionalPaperScore' },
          avgTotalScore: { 
            $avg: { $add: ['$exam.generalPaperScore', '$exam.professionalPaperScore'] } 
          },
          totalCandidates: { $sum: 1 },
          passedCandidates: {
            $sum: {
              $cond: [{ $eq: ['$exam.examStatus', examStatus.passed] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          examType: '$_id',
          avgGeneralScore: { $round: ['$avgGeneralScore', 2] },
          avgProfessionalScore: { $round: ['$avgProfessionalScore', 2] },
          avgTotalScore: { $round: ['$avgTotalScore', 2] },
          totalCandidates: 1,
          passedCandidates: 1,
          passRate: {
            $round: [{ $multiply: [{ $divide: ['$passedCandidates', '$totalCandidates'] }, 100] }, 2]
          }
        }
      },
      {
        $sort: { examType: 1 }
      }
    ]);

    return averageScores;
  }
}