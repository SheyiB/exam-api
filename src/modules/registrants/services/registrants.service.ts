import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { examType, examStatus, ExamsDoc, ExamsEntity } from '../../exams/repository/entities/exams.entity';
import { ExamStatus } from 'src/modules/exams/dtos/exams.create.dto';
import { CloudinaryStorageService } from 'src/common/cloudinary/services/cloudinary.storage.service';
import { RegistrantMapper } from '../mappers/registrant.mapper';
import { RegistrantExamUpdateDto } from '../dtos/registrants.update-exam.dto';
import { ExamUpdateDto } from 'src/modules/exams/dtos/exams.update.dto';
import { RegistrantUpdateDto } from '../dtos/registrants.update.dto';
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

    @InjectModel(ExamsEntity.name)
    private examsModel: Model<ExamsDoc>,
    private readonly cloudinaryStorageService: CloudinaryStorageService,
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
  registrant: RegistrantCreateDto & { profilePicture?: Express.Multer.File }
): Promise<RegistrantsDoc> {
  let profilePictureUrl: string | undefined;

  const existingRegistrant = await this.registrantsModel.findOne({
    email: registrant.email,
  }).lean();

  if (existingRegistrant) {
    throw new UnprocessableEntityException({
      statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
      message: ENUM_RESPONSE_MESSAGE.REGISTRANT_EXIST,
    });
  }

  if (registrant.profilePicture) {
    try {
      profilePictureUrl = await this.cloudinaryStorageService.uploadFile(
        `${registrant.surname} ${registrant.firstName}`,
        registrant.profilePicture
      );
    } catch (error) {
      console.error('Profile picture upload failed:', error);
    }
  }

  const registeredUsers = await this.registrantsModel.countDocuments({
    'exam.examType': registrant.exam.examType,
  });

  const examNumber = this.generateExamNumber(
    registeredUsers,
    registrant.exam.examType
  );

  const newExam = await this.examsModel.create({
    examType: registrant.exam.examType,
    examDate: registrant.exam.examDate,
    examNumber,
    examStatus: ExamStatus.PENDING,
  });

  const newRegistrant = await this.registrantsModel.create({
    ...registrant,
    exam: newExam._id,
    profilePassport: profilePictureUrl,
  });

  const populatedRegistrant = await this.registrantsModel
    .findById(newRegistrant._id)
    .populate('exam')
    .lean();

  return populatedRegistrant;
}

  // async updateRegistrants(
  //   id: string,
  //   registrant: Partial<RegistrantCreateDto>,
  //   uploader: string
  // ): Promise<RegistrantsDoc> {
  //   // The pre-update middleware will automatically update the examStatus based on scores

  //     const updateObject: any = { ...registrant };
    
  //   if (registrant.exam.generalPaperScore && registrant.exam.professionalPaperScore) {
  //     registrant.exam.totalScore = registrant.exam.generalPaperScore + registrant.exam.professionalPaperScore;
  //     if (registrant.exam.totalScore < 50) {
  //       registrant.exam.examStatus = ExamStatus.FAILED;
  //     } else if (registrant.exam.totalScore >= 50) {
  //       registrant.exam.examStatus = ExamStatus.PASSED;
  //     }
  //    }
    
  //   if (registrant.exam) {
  //     updateObject.exam = RegistrantMapper.mapExamDtoToUpdate(registrant.exam, uploader);
  //   }
    
  //   const existingRegistrant = await this.registrantsModel.findByIdAndUpdate(
  //     id,
  //     updateObject,
  //     { new: true }
  //   );

  //   if (!existingRegistrant) {
  //     throw new NotFoundException({
  //       statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_NOT_FOUND_ERROR,
  //       message: ENUM_RESPONSE_MESSAGE.REGISTRANT_NOT_FOUND,
  //     });
  //   }

  //   return existingRegistrant;
  // }
  async updateRegistrant(
  registrantId: string,
  updateDto: RegistrantUpdateDto,
  uploaderId: string
): Promise<RegistrantsDoc> {
  // Retrieve the registrant by ID
  const registrant = await this.registrantsModel.findById(registrantId);

  if (!registrant) {
    throw new NotFoundException({
      statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_NOT_FOUND_ERROR,
      message: ENUM_RESPONSE_MESSAGE.REGISTRANT_NOT_FOUND,
    });
  }

  // Apply the fields from the DTO to the registrant
  const updatedRegistrant = { ...registrant.toObject(), ...updateDto };

  // Check if exam is being updated
  if (updateDto.exam) {
    // THROW ERROR
    throw new UnprocessableEntityException({
      statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
      message: ENUM_RESPONSE_MESSAGE.INVALID_ROUTE,
    });
  }

  // Handle updating profile picture
  if (updateDto.profilePicture) {
    try {
      updatedRegistrant.profilePassport = await this.cloudinaryStorageService.uploadFile(
        `${updatedRegistrant.surname} ${updatedRegistrant.firstName}`,
        updateDto.profilePicture
      );
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      // Continue with registrant update even if the image upload fails
    }
  }

  // Save the updated registrant entity
  const savedRegistrant = await this.registrantsModel.findByIdAndUpdate(
    registrantId,
    updatedRegistrant,
    { new: true }
  );

  return savedRegistrant;
}

//   async updateRegistrantExam(
//   id: string,
//   dto: RegistrantExamUpdateDto,
//   uploader: string
// ) {
//   const update: any = {};

//   if (dto.exam) {
//     update.exam = RegistrantMapper.mapExamDtoToUpdate(dto.exam, uploader);
//   }

//   return this.registrantsModel.findByIdAndUpdate(id, update, { new: true });
  // }
 async updateRegistrantExam(
  registrantId: string,
  examUpdateDto: RegistrantExamUpdateDto,
  uploaderId: string,
): Promise<ExamsDoc> {
  const registrant = await this.registrantsModel.findById(registrantId).populate({
  path: 'exam',
  model: 'ExamsEntity'
});

  if (!registrant || !registrant.exam) {
    throw new NotFoundException({
      statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_NOT_FOUND_ERROR,
      message: ENUM_RESPONSE_MESSAGE.REGISTRANT_NOT_FOUND,
    });
  }

  const exam = await this.examsModel.findById(registrant.exam._id);
  if (!exam || !examUpdateDto.exam) {
    throw new NotFoundException({
      statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_NOT_FOUND_ERROR,
      message: 'Exam record or update payload missing',
    });
  }

  const updatableFields = {
    generalPaperScore: 'generalPaperScoreUploadedBy',
    professionalPaperScore: 'professionalPaperScoreUploadedBy',
    interviewScore: 'interviewScoreUploadedBy',
    appraisalScore: 'appraisalScoreUploadedBy',
    seniorityScore: 'seniorityScoreUploadedBy',
  };

  const updated = examUpdateDto.exam;

  for (const [scoreKey, uploaderKey] of Object.entries(updatableFields)) {
    const score = updated[scoreKey as keyof ExamUpdateDto];
    if (typeof score === 'number') {
      (exam as any)[scoreKey] = score;
      (exam as any)[uploaderKey] = uploaderId;
    }
  }

  if (updated.remark !== undefined) {
    exam.remark = updated.remark;
  }

  // Recalculate totalScore
  const total = Object.keys(updatableFields)
    .map(key => (exam as any)[key])
    .filter(score => typeof score === 'number')
    .reduce((sum, val) => sum + val, 0);

  exam.totalScore = total;
  exam.totalScoreUploadedBy = new Types.ObjectId(uploaderId);

  exam.examStatus = total < 50 ? ExamStatus.FAILED : ExamStatus.PASSED;

  await exam.save();
  return exam;
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

  const { limit: _, page: __, search, ...filterQuery } = query;

  const matchStage: any = { ...filterQuery };

  const searchRegex = search ? new RegExp(search, 'i') : null;

  if (searchRegex) {
    matchStage.$or = [
      { surname: searchRegex },
      { firstName: searchRegex },
      { middleName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { staffVerificationNumber: searchRegex },
      { mda: searchRegex },
      { presentRank: searchRegex },
      { expectedRank: searchRegex },
      { cadre: searchRegex },
    ];
  }

  const pipeline: any[] = [
    { $match: matchStage },

    {
      $lookup: {
        from: 'examsentities', // Collection name derived from ExamsEntity
        localField: 'exam',
        foreignField: '_id',
        as: 'exam',
      },
    },
    { $unwind: { path: '$exam', preserveNullAndEmptyArrays: true } },

    ...(searchRegex
      ? [
          {
            $match: {
              $or: [
                { 'exam.examNumber': searchRegex },
                { 'exam.examType': searchRegex },
                { 'exam.examStatus': searchRegex },
                { 'exam.remark': searchRegex },
              ],
            },
          },
        ]
      : []),

    // Project stage to include exam fields directly in the main document
    {
      $addFields: {
        'examNumber': '$exam.examNumber',
        'examType': '$exam.examType'
      }
    },

    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  const data = await this.registrantsModel.aggregate(pipeline).exec();

  const countPipeline: any[] = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'exams_entity',
        localField: 'exam',
        foreignField: '_id',
        as: 'exam',
      },
    },
    { $unwind: { path: '$exam', preserveNullAndEmptyArrays: true } },
    ...(searchRegex
      ? [
          {
            $match: {
              $or: [
                { 'exam.examNumber': searchRegex },
                { 'exam.examType': searchRegex },
                { 'exam.examStatus': searchRegex },
                { 'exam.remark': searchRegex },
              ],
            },
          },
        ]
      : []),
    { $count: 'total' },
  ];

  const countResult = await this.registrantsModel.aggregate(countPipeline).exec();
  const total = countResult[0]?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
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
  const existingRegistrant = await this.registrantsModel
    .findById(id)
    .populate({
      path: 'exam',
      populate: [
        { path: 'generalPaperScoreUploadedBy', model: 'UserEntity', select: 'fullname jobTitle department' },
        { path: 'professionalPaperScoreUploadedBy', model: 'UserEntity', select: 'fullname jobTitle department' },
        { path: 'interviewScoreUploadedBy', model: 'UserEntity', select: 'fullname jobTitle department' },
        { path: 'appraisalScoreUploadedBy', model: 'UserEntity', select: 'fullname jobTitle department' },
        { path: 'seniorityScoreUploadedBy', model: 'UserEntity', select: 'fullname jobTitle department' },
        { path: 'totalScoreUploadedBy', model: 'UserEntity', select: 'fullname jobTitle department' },
        { path: 'remarkUploadedBy', model: 'UserEntity', select: 'fullname jobTitle department' },
      ]
    })
    .lean();

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
        },
      },
      {
        $group: {
          _id: {
            presentGradeLevel: '$presentGradeLevel',
            expectedGradeLevel: '$expectedGradeLevel',
          },
          count: { $sum: 1 },
        },
      },
    ]);


    const rankRange = Array.from({ length: 15 }, (_, i) => ({
    presentGradeLevel: String(i + 1), 
    expectedGradeLevel: String(i + 2), 
    }));

    const statsMap = promotionResults.reduce((acc, { _id, count }) => {
      const key = `${_id.presentGradeLevel}-${_id.expectedGradeLevel}`;
      acc[key] = count;
      return acc;
    }, {});

    const stats = rankRange.map(({ presentGradeLevel, expectedGradeLevel }) => ({
      presentGradeLevel,
      expectedGradeLevel,
      count: statsMap[`${presentGradeLevel}-${expectedGradeLevel}`] || 0,
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

 async getExamStatusByLevel(examTypeFilter?: examType) {
  // Base aggregation pipeline
  const pipeline = [
    // Add match stage if examType is provided
    ...(examTypeFilter ? [{ $match: { 'exam.examType': examTypeFilter } }] : []),
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
  ];

  const examStatusByLevel = await this.registrantsModel.aggregate(pipeline);

  const stats = examStatusByLevel
    .map(({ _id, passed, failed, pending }) => ({
      level: _id,
      passed,
      failed,
      pending,
    }))
    .sort((a, b) => {
      if (a.level < b.level) {
        return -1;
      }
      if (a.level > b.level) {
        return 1;
      }
      return 0;
    });

  return stats;
 }
  
  async setPassMark() {
    
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