import { BadRequestException, Injectable } from '@nestjs/common';
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
import { ExamStatus, ExamType } from 'src/modules/exams/dtos/exams.create.dto';
import { CloudinaryStorageService } from 'src/common/cloudinary/services/cloudinary.storage.service';
import { RegistrantMapper } from '../mappers/registrant.mapper';
import { RegistrantExamUpdateDto } from '../dtos/registrants.update-exam.dto';
import { ExamUpdateDto } from 'src/modules/exams/dtos/exams.update.dto';
import { ExamPassScoreDoc, ExamPassScore } from 'src/modules/exams/repository/entities/exam.passScore.entity';
import { RegistrantUpdateDto } from '../dtos/registrants.update.dto';
import { EmployeeDoc, EmployeeEntity } from '../../employees/repository/entities/employee.entity'
import { CivilServantService, CivilServant } from '../../civil-servants/civil-servant.service';
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

    @InjectModel(ExamPassScore.name) private examPassScoreModel: Model<ExamPassScoreDoc>,

    private readonly civilServantService: CivilServantService,

    @InjectModel(EmployeeEntity.name)
    private employeeModel: Model<EmployeeDoc>,
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
  
   let newRegistrantData: any;
   
   let civilServant: CivilServant | null = null;


  const existingRegistrant = await this.registrantsModel.findOne({
    email: registrant.email,
  }).lean();

  if (existingRegistrant) {
    throw new UnprocessableEntityException({
      statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
      message: ENUM_RESPONSE_MESSAGE.REGISTRANT_EXIST,
    });
  }

   try {
      // Try to find by NIN first (most reliable)
      if (registrant.nin) {
        civilServant = await this.civilServantService.findByNin(registrant.nin);
      }

      // If not found by NIN, try by service number
      if (!civilServant && registrant.staffVerificationNumber) {
        civilServant = await this.civilServantService.findByServiceNumber(registrant.staffVerificationNumber);
      }

      // If both NIN and service number are provided, validate they belong to the same person
      if (registrant.nin && registrant.staffVerificationNumber) {
        const validatedCivilServant = await this.civilServantService.validateCivilServant(
          registrant.nin, 
          registrant.staffVerificationNumber
        );
        
        if (!validatedCivilServant) {
          throw new BadRequestException({
            statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
            message: 'NIN and Staff Verification Number do not match in our records',
          });
        }
        
        civilServant = validatedCivilServant;
      }

      if (!civilServant) {
        throw new UnprocessableEntityException({
          statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
          message: ENUM_RESPONSE_MESSAGE.REGISTRANT_NOT_IN_NOMINAL_ROLL,
        });
      }

    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnprocessableEntityException) {
        throw error;
      }
      
      console.error('Error validating civil servant:', error);
      throw new UnprocessableEntityException({
        statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_UNKNOWN_ERROR,
        message: 'Error validating registrant against civil servant database',
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
      throw new UnprocessableEntityException({
        statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
        message: 'Profile picture upload failed',
      });
    }
  }

  const registeredUsers = await this.examsModel.countDocuments({
    examType: registrant.exam.examType,
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
   
   newRegistrantData = { 
      ...registrant,
      employeePassport: civilServant.passport_url
    };

  const newRegistrant = await this.registrantsModel.create({
    ...newRegistrantData,
    exam: newExam._id,
    profilePassport: profilePictureUrl,
  });
   
  const populatedRegistrant = await this.registrantsModel
    .findById(newRegistrant._id)
    .populate('exam')
    .lean();

  return populatedRegistrant;
}

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
    examScore: 'examScoreTrail',
    generalPaperScore: 'generalPaperScoreTrail',
    professionalPaperScore: 'professionalPaperScoreTrail',
    interviewScore: 'interviewScoreTrail',
    appraisalScore: 'appraisalScoreTrail',
    seniorityScore: 'seniorityScoreTrail',
  };

  const updated = examUpdateDto.exam;
  const now = new Date();
  const userObjectId = new Types.ObjectId(uploaderId);

  // Update scores and add to trails
  for (const [scoreKey, trailKey] of Object.entries(updatableFields)) {
    const score = updated[scoreKey as keyof ExamUpdateDto];
    if (typeof score === 'number') {
      // Add new entry to the score trail
      (exam as any)[trailKey].push({
        score: score,
        uploadedBy: userObjectId,
        uploadedAt: now
      });
    }
  }

  // Update remark if provided
  if (updated.remark !== undefined) {
    exam.remarkTrail.push({
      remark: updated.remark,
      uploadedBy: userObjectId,
      uploadedAt: now
    });
  }

  // Recalculate totalScore using the most recent scores from each category
  // Note: examScore is included in the calculation if you want it to contribute to total
  const scoreFields = ['examScore', 'generalPaperScore', 'professionalPaperScore', 'interviewScore', 'appraisalScore', 'seniorityScore'];
  const total = scoreFields
    .map(key => {
      const trailKey = updatableFields[key as keyof typeof updatableFields];
      const trail = (exam as any)[trailKey];
      return trail.length > 0 ? trail[trail.length - 1].score : 0;
    })
    .reduce((sum, val) => sum + val, 0);

  // Add total score to its trail
  exam.totalScoreTrail.push({
    score: total,
    uploadedBy: userObjectId,
    uploadedAt: now
  });

  // Update exam status based on total score
  exam.examStatus = total < 50 ? examStatus.failed : examStatus.passed;

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
       {
          path: 'examScoreTrail.uploadedBy',
          model: 'UserEntity',
          select: 'fullname department jobTitle workEmailAddress'
        },
      { 
        path: 'generalPaperScoreTrail.uploadedBy', 
        model: 'UserEntity',
        select: 'fullname department jobTitle workEmailAddress' // Add the fields you want
      },
      
      { 
        path: 'professionalPaperScoreTrail.uploadedBy', 
        model: 'UserEntity',
        select: 'fullname department jobTitle workEmailAddress'
      },
      { 
        path: 'interviewScoreTrail.uploadedBy', 
        model: 'UserEntity',
        select: 'fullname department jobTitle workEmailAddress'
      },
      { 
        path: 'appraisalScoreTrail.uploadedBy', 
        model: 'UserEntity',
        select: 'fullname department jobTitle workEmailAddress'
      },
      { 
        path: 'seniorityScoreTrail.uploadedBy', 
        model: 'UserEntity',
        select: 'fullname department jobTitle workEmailAddress'
      },
      { 
        path: 'totalScoreTrail.uploadedBy', 
        model: 'UserEntity',
        select: 'fullname department jobTitle workEmailAddress'
      },
      { 
        path: 'remarkTrail.uploadedBy', 
        model: 'UserEntity',
        select: 'fullname department jobTitle workEmailAddress'
      }
      ]
    }) as any;
   
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

  // Helper method to get or create pass score for an exam type
  async getPassScoreForExamType(examType: examType): Promise<number> {
    try {
      let passScoreDoc = await this.examPassScoreModel.findOne({ examType });
      
      if (!passScoreDoc) {
        // Create default pass score if it doesn't exist
        passScoreDoc = await this.examPassScoreModel.create({
          examType,
          passScore: 60,
          createdAt: new Date(),
        });
      }
      
      return passScoreDoc.passScore;
    } catch (error) {
      console.warn(`Error getting pass score for ${examType}, using default 60:`, error);
      return 60; // Default fallback
    }
  }

  // Helper method to calculate total score from exam trails
  private calculateTotalScore(examData: any): number {
    const scores = [
      this.getLatestScore(examData.generalPaperScoreTrail),
      this.getLatestScore(examData.professionalPaperScoreTrail),
      this.getLatestScore(examData.interviewScoreTrail),
      this.getLatestScore(examData.appraisalScoreTrail),
      this.getLatestScore(examData.seniorityScoreTrail),
    ].filter(score => score !== null);

    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  // Helper method to get latest score from trail
  private getLatestScore(trail: any[]): number | null {
    if (!trail || trail.length === 0) return null;
    return trail[trail.length - 1].score;
  }

 async registrantStats() {
  const [
    totalRegistrations,
    incapacitatedStats,
    examTypeStats,
  ] = await Promise.all([
    this.registrantsModel.countDocuments(),
    this.registrantsModel.countDocuments({ disability: true }),
    this.registrantsModel.aggregate([
      {
        $lookup: {
          from: 'exams',
          localField: 'exam',
          foreignField: '_id',
          as: 'examData'
        }
      },
      {
        $unwind: {
          path: '$examData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: '$examData.examType',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Get pass scores for all exam types
  const promotionPassScore = await this.getPassScoreForExamType('promotion' as examType);
  const conversionPassScore = await this.getPassScoreForExamType('conversion'  as examType);
  const confirmationPassScore = await this.getPassScoreForExamType('confirmation'  as examType);

  const passScoreMap = {
    'promotion': promotionPassScore,
    'conversion': conversionPassScore,
    'confirmation': confirmationPassScore,
  };


  // Get all registrants with their exam data
  const registrantsWithExams = await this.registrantsModel.aggregate([
    {
      $lookup: {
        from: 'examsentities',
        localField: 'exam',
        foreignField: '_id',
        as: 'examData'
      }
    },
    {
      $unwind: {
        path: '$examData',
        preserveNullAndEmptyArrays: false // Only include registrants who have exam records
      }
    },
    {
      $project: {
        _id: 1,
        examData: 1
      }
    }
  ]);
   

  let totalPassed = 0;
  let totalFailed = 0;
  let totalPending = 0;

  // Process each registrant with exam data
  registrantsWithExams.forEach(registrant => {
    const examData = registrant.examData;
    const examType = examData.examType;
    
    // Calculate total score from the latest scores in each trail
    let totalScore = 0;
    let scoreCount = 0;
    let hasAnyScore = false;

    // Check each score trail and get the latest score
    const scoreTrails = [
      examData.generalPaperScoreTrail,
      examData.professionalPaperScoreTrail,
      examData.interviewScoreTrail,
      examData.appraisalScoreTrail,
      examData.seniorityScoreTrail,
      examData.examScoreTrail,
    ];

    scoreTrails.forEach(trail => {
      if (trail && trail.length > 0) {
        const latestScore = trail[trail.length - 1].score;
        if (latestScore !== null && latestScore !== undefined) {
          totalScore += latestScore;
          scoreCount++;
          hasAnyScore = true;
        }
      }
    });

    // Calculate average score if we have any scores
    const calculatedScore = hasAnyScore && scoreCount > 0 ? totalScore : 0;
    
    // Get pass score for this exam type (default to 60 if not found)
    const passScore = passScoreMap[examType] || 60;
    

    // Determine status based on calculated score
    if (!hasAnyScore || calculatedScore === 0) {
      // No scores available - consider as pending
      totalPending++;
    } else if (calculatedScore >= passScore) {
      totalPassed++;
    } else {
      totalFailed++;
    }
  });

  // Create exam type map
  const examTypeMap = examTypeStats.reduce((acc, { _id, count }) => ({
    ...acc,
    [`total${_id || 'Unknown'}Exams`]: count,
  }), {});

  return {
    totalRegistrations,
    totalPassed,
    totalFailed,
    totalPending,
    totalIncapacitated: incapacitatedStats,
    ...examTypeMap,
  };
}

 async registrantByPromotion() {
  // Get pass scores for all exam types
  const promotionPassScore = await this.getPassScoreForExamType('promotion' as examType);
  const conversionPassScore = await this.getPassScoreForExamType('conversion' as examType);
  const confirmationPassScore = await this.getPassScoreForExamType('confirmation' as examType);

  const passScoreMap = {
    'promotion': promotionPassScore,
    'conversion': conversionPassScore,
    'confirmation': confirmationPassScore,
  };

  // Get all registrants with their exam data
  const registrantsWithExams = await this.registrantsModel.aggregate([
    {
      $lookup: {
        from: 'examsentities',
        localField: 'exam',
        foreignField: '_id',
        as: 'examData'
      }
    },
    {
      $unwind: {
        path: '$examData',
        preserveNullAndEmptyArrays: false // Only include registrants who have exam records
      }
    },
    {
      $project: {
        _id: 1,
        presentGradeLevel: 1,
        expectedGradeLevel: 1,
        examData: 1
      }
    }
  ]);

  // Filter registrants who passed their exams
  const passedRegistrants = [];

  registrantsWithExams.forEach(registrant => {
    const examData = registrant.examData;
    const examType = examData.examType;
    
    // Calculate total score from the latest scores in each trail
    let totalScore = 0;
    let scoreCount = 0;
    let hasAnyScore = false;

    // Check each score trail and get the latest score
    const scoreTrails = [
      examData.generalPaperScoreTrail,
      examData.professionalPaperScoreTrail,
      examData.interviewScoreTrail,
      examData.appraisalScoreTrail,
      examData.seniorityScoreTrail,
      examData.examScoreTrail,
    ];

    scoreTrails.forEach(trail => {
      if (trail && trail.length > 0) {
        const latestScore = trail[trail.length - 1].score;
        if (latestScore !== null && latestScore !== undefined) {
          totalScore += latestScore;
          scoreCount++;
          hasAnyScore = true;
        }
      }
    });

    // Calculate average score if we have any scores
    const calculatedScore = hasAnyScore && scoreCount > 0 ? totalScore : 0;
    
    // Get pass score for this exam type (default to 60 if not found)
    const passScore = passScoreMap[examType] || 60;

    // Check if registrant passed
    if (hasAnyScore && calculatedScore >= passScore) {
      passedRegistrants.push({
        presentGradeLevel: registrant.presentGradeLevel,
        expectedGradeLevel: registrant.expectedGradeLevel
      });
    }
  });

  // Group passed registrants by grade levels
  const promotionResults = passedRegistrants.reduce((acc, registrant) => {
    const key = `${registrant.presentGradeLevel}-${registrant.expectedGradeLevel}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Create rank range for levels 1-15
  const rankRange = Array.from({ length: 15 }, (_, i) => ({
    presentGradeLevel: String(i + 1),
    expectedGradeLevel: String(i + 2),
  }));

  // Map the results to the rank range
  const stats = rankRange.map(({ presentGradeLevel, expectedGradeLevel }) => ({
    presentGradeLevel,
    expectedGradeLevel,
    count: promotionResults[`${presentGradeLevel}-${expectedGradeLevel}`] || 0,
  }));

  return stats;
}

async getRegistrantsByStatus(
  status: 'passed' | 'failed' | 'pending' | 'incapacitated',
  query: { limit?: string; page?: string; search?: string; [key: string]: any }
): Promise<any> {
  const limit = Math.min(parseInt(query.limit || '20', 10), 100);
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const skip = (page - 1) * limit;

  // Get pass scores for all exam types
  const promotionPassScore = await this.getPassScoreForExamType('promotion' as examType);
  const conversionPassScore = await this.getPassScoreForExamType('conversion' as examType);
  const confirmationPassScore = await this.getPassScoreForExamType('confirmation' as examType);

  const passScoreMap = {
    'promotion': promotionPassScore,
    'conversion': conversionPassScore,
    'confirmation': confirmationPassScore,
  };

  // Remove pagination and search params from query
  const { limit: _, page: __, search, ...filterQuery } = query;

  // Build aggregation pipeline
  const pipeline: any[] = [
    {
      $lookup: {
        from: 'examsentities',
        localField: 'exam',
        foreignField: '_id',
        as: 'examData'
      }
    },
    {
      $unwind: {
        path: '$examData',
        preserveNullAndEmptyArrays: status === 'incapacitated'
      }
    }
  ];

  // Add search functionality
  if (search) {
    pipeline.push({
      $match: {
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
          { presentGradeLevel: { $regex: search, $options: 'i' } },
          { cadre: { $regex: search, $options: 'i' } },
          { 'examData.examNumber': { $regex: search, $options: 'i' } },
          { 'examData.examType': { $regex: search, $options: 'i' } }
        ]
      }
    });
  }

  // Apply other filters (excluding exam status-based filters)
  const nonExamStatusFilters = { ...filterQuery };
  
  // Handle exam.examType filter
  if (query['exam.examType']) {
    nonExamStatusFilters['examData.examType'] = query['exam.examType'];
    delete nonExamStatusFilters['exam.examType'];
  }

  // Remove exam.examStatus filter as we'll handle status through score calculation
  delete nonExamStatusFilters['exam.examStatus'];

  if (Object.keys(nonExamStatusFilters).length > 0) {
    pipeline.push({
      $match: nonExamStatusFilters
    });
  }

  // Handle incapacitated status separately
  if (status === 'incapacitated') {
    pipeline.push({
      $match: { disability: true }
    });
    
    // Get total count for incapacitated
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.registrantsModel.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Get paginated results
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    );

    const registrants = await this.registrantsModel.aggregate(pipeline);
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

  // For non-incapacitated statuses, we need to calculate scores
  const allRegistrants = await this.registrantsModel.aggregate(pipeline);
  
  // Filter registrants based on calculated status
  const filteredRegistrants = [];

  allRegistrants.forEach(registrant => {
    const examData = registrant.examData;
    
    if (!examData) return; // Skip if no exam data

    const examType = examData.examType;
    
    // Calculate total score from the latest scores in each trail
    let totalScore = 0;
    let scoreCount = 0;
    let hasAnyScore = false;

    // Check each score trail and get the latest score
    const scoreTrails = [
      examData.generalPaperScoreTrail,
      examData.professionalPaperScoreTrail,
      examData.interviewScoreTrail,
      examData.appraisalScoreTrail,
      examData.seniorityScoreTrail,
      examData.examScoreTrail,
    ];

    scoreTrails.forEach(trail => {
      if (trail && trail.length > 0) {
        const latestScore = trail[trail.length - 1].score;
        if (latestScore !== null && latestScore !== undefined) {
          totalScore += latestScore;
          scoreCount++;
          hasAnyScore = true;
        }
      }
    });

    // Calculate average score if we have any scores
    const calculatedScore = hasAnyScore && scoreCount > 0 ? totalScore : 0;
    
    // Get pass score for this exam type (default to 60 if not found)
    const passScore = passScoreMap[examType] || 60;

    // Determine registrant's status
    let registrantStatus: string;
    if (!hasAnyScore || calculatedScore === 0) {
      registrantStatus = 'pending';
    } else if (calculatedScore >= passScore) {
      registrantStatus = 'passed';
    } else {
      registrantStatus = 'failed';
    }

    // Include registrant if their status matches the requested status
    if (registrantStatus === status) {
      filteredRegistrants.push(registrant);
    }
  });

  // Apply pagination to filtered results
  const total = filteredRegistrants.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedRegistrants = filteredRegistrants
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(skip, skip + limit);

  return {
    data: paginatedRegistrants,
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
  // Get pass scores for all exam types
  const promotionPassScore = await this.getPassScoreForExamType('promotion' as examType);
  const conversionPassScore = await this.getPassScoreForExamType('conversion' as examType);
  const confirmationPassScore = await this.getPassScoreForExamType('confirmation' as examType);

  const passScoreMap = {
    'promotion': promotionPassScore,
    'conversion': conversionPassScore,
    'confirmation': confirmationPassScore,
  };

  const pipeline: any[] = [
    {
      $lookup: {
        from: 'examsentities',
        localField: 'exam',
        foreignField: '_id',
        as: 'examData'
      }
    },
    {
      $unwind: {
        path: '$examData',
        preserveNullAndEmptyArrays: false // Only include registrants who have exam records
      }
    },
    {
      $project: {
        _id: 1,
        presentGradeLevel: 1,
        examData: 1
      }
    }
  ];

  // Add match stage if examType is provided
  if (examTypeFilter) {
    pipeline.push({ $match: { 'examData.examType': examTypeFilter } });
  }

  const registrantsWithExams = await this.registrantsModel.aggregate(pipeline);

  // Process each registrant to determine their exam status
  const statusByLevel = {};

  registrantsWithExams.forEach(registrant => {
    const examData = registrant.examData;
    const examType = examData.examType;
    const gradeLevel = registrant.presentGradeLevel;

    // Initialize level stats if not exists
    if (!statusByLevel[gradeLevel]) {
      statusByLevel[gradeLevel] = {
        passed: 0,
        failed: 0,
        pending: 0
      };
    }

    // Calculate total score from the latest scores in each trail
    let totalScore = 0;
    let scoreCount = 0;
    let hasAnyScore = false;

    // Check each score trail and get the latest score
    const scoreTrails = [
      examData.generalPaperScoreTrail,
      examData.professionalPaperScoreTrail,
      examData.interviewScoreTrail,
      examData.appraisalScoreTrail,
      examData.seniorityScoreTrail,
      examData.examScoreTrail,
    ];

    scoreTrails.forEach(trail => {
      if (trail && trail.length > 0) {
        const latestScore = trail[trail.length - 1].score;
        if (latestScore !== null && latestScore !== undefined) {
          totalScore += latestScore;
          scoreCount++;
          hasAnyScore = true;
        }
      }
    });

    // Calculate average score if we have any scores
    const calculatedScore = hasAnyScore && scoreCount > 0 ? totalScore : 0;
    
    // Get pass score for this exam type (default to 60 if not found)
    const passScore = passScoreMap[examType] || 60;

    // Determine status based on calculated score
    if (!hasAnyScore || calculatedScore === 0) {
      // No scores available - consider as pending
      statusByLevel[gradeLevel].pending++;
    } else if (calculatedScore >= passScore) {
      statusByLevel[gradeLevel].passed++;
    } else {
      statusByLevel[gradeLevel].failed++;
    }
  });

  // Create stats for all levels 1-17, including those with no data
  const stats = Array.from({ length: 17 }, (_, i) => {
    const level = String(i + 1);
    const levelStats = statusByLevel[level] || { passed: 0, failed: 0, pending: 0 };
    
    return {
      level,
      passed: levelStats.passed,
      failed: levelStats.failed,
      pending: levelStats.pending,
    };
  });

  return stats;
}

  async getAverageScoresByExamType() {
    const averageScores = await this.registrantsModel.aggregate([
      {
        $lookup: {
          from: 'exams',
          localField: 'exam',
          foreignField: '_id',
          as: 'examData'
        }
      },
      {
        $unwind: { 
          path: '$examData', 
          preserveNullAndEmptyArrays: false 
        }
      },
      {
        $match: {
          $or: [
            { 'examData.generalPaperScoreTrail': { $exists: true, $ne: [] } },
            { 'examData.professionalPaperScoreTrail': { $exists: true, $ne: [] } }
          ]
        }
      },
      {
        $addFields: {
          // Get the latest scores from trails
          latestGeneralScore: { 
            $let: {
              vars: { 
                trail: '$examData.generalPaperScoreTrail' 
              },
              in: { 
                $cond: [
                  { $gt: [{ $size: '$$trail' }, 0] },
                  { $arrayElemAt: ['$$trail.score', -1] },
                  null
                ]
              }
            }
          },
          latestProfessionalScore: { 
            $let: {
              vars: { 
                trail: '$examData.professionalPaperScoreTrail' 
              },
              in: { 
                $cond: [
                  { $gt: [{ $size: '$$trail' }, 0] },
                  { $arrayElemAt: ['$$trail.score', -1] },
                  null
                ]
              }
            }
          },
          latestInterviewScore: { 
            $let: {
              vars: { 
                trail: '$examData.interviewScoreTrail' 
              },
              in: { 
                $cond: [
                  { $gt: [{ $size: '$$trail' }, 0] },
                  { $arrayElemAt: ['$$trail.score', -1] },
                  null
                ]
              }
            }
          },
          latestAppraisalScore: { 
            $let: {
              vars: { 
                trail: '$examData.appraisalScoreTrail' 
              },
              in: { 
                $cond: [
                  { $gt: [{ $size: '$$trail' }, 0] },
                  { $arrayElemAt: ['$$trail.score', -1] },
                  null
                ]
              }
            }
          },
          latestSeniorityScore: { 
            $let: {
              vars: { 
                trail: '$examData.seniorityScoreTrail' 
              },
              in: { 
                $cond: [
                  { $gt: [{ $size: '$$trail' }, 0] },
                  { $arrayElemAt: ['$$trail.score', -1] },
                  null
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          calculatedTotalScore: {
            $let: {
              vars: {
                validScores: {
                  $filter: {
                    input: [
                      '$latestGeneralScore',
                      '$latestProfessionalScore', 
                      '$latestInterviewScore',
                      '$latestAppraisalScore',
                      '$latestSeniorityScore'
                    ],
                    cond: { $ne: ['$$this', null] }
                  }
                }
              },
              in: {
                $cond: [
                  { $gt: [{ $size: '$$validScores' }, 0] },
                  { $divide: [{ $sum: '$$validScores' }, { $size: '$$validScores' }] },
                  0
                ]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$examData.examType',
          avgGeneralScore: { $avg: '$latestGeneralScore' },
          avgProfessionalScore: { $avg: '$latestProfessionalScore' },
          avgInterviewScore: { $avg: '$latestInterviewScore' },
          avgAppraisalScore: { $avg: '$latestAppraisalScore' },
          avgSeniorityScore: { $avg: '$latestSeniorityScore' },
          avgTotalScore: { $avg: '$calculatedTotalScore' },
          totalCandidates: { $sum: 1 },
          passedCandidates: {
            $sum: {
              $cond: [{ $eq: ['$examData.examStatus', examStatus.passed] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          examType: '$_id',
          avgGeneralScore: { $round: ['$avgGeneralScore', 2] },
          avgProfessionalScore: { $round: ['$avgProfessionalScore', 2] },
          avgInterviewScore: { $round: ['$avgInterviewScore', 2] },
          avgAppraisalScore: { $round: ['$avgAppraisalScore', 2] },
          avgSeniorityScore: { $round: ['$avgSeniorityScore', 2] },
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

    // Add pass score information to each exam type
    const enrichedScores = await Promise.all(
      averageScores.map(async (score) => {
        const passScore = await this.getPassScoreForExamType(score.examType);
        return {
          ...score,
          passScore,
        };
      })
    );

    return enrichedScores;
  }

  async getPassFailAnalysisByExamType() {
    const examTypes = [examType.promotion, examType.conversion, examType.confirmation];
    
    const analysis = await Promise.all(
      examTypes.map(async (type) => {
        const passScore = await this.getPassScoreForExamType(type);
        
        const results = await this.registrantsModel.aggregate([
          {
            $lookup: {
              from: 'exams',
              localField: 'exam',
              foreignField: '_id',
              as: 'examData'
            }
          },
          {
            $unwind: { 
              path: '$examData', 
              preserveNullAndEmptyArrays: false 
            }
          },
          {
            $match: {
              'examData.examType': type
            }
          },
          {
            $addFields: {
              calculatedTotalScore: {
                $let: {
                  vars: {
                    validScores: {
                      $filter: {
                        input: [
                          { $cond: [{ $gt: [{ $size: { $ifNull: ['$examData.generalPaperScoreTrail', []] } }, 0] }, { $arrayElemAt: ['$examData.generalPaperScoreTrail.score', -1] }, null] },
                          { $cond: [{ $gt: [{ $size: { $ifNull: ['$examData.professionalPaperScoreTrail', []] } }, 0] }, { $arrayElemAt: ['$examData.professionalPaperScoreTrail.score', -1] }, null] },
                          { $cond: [{ $gt: [{ $size: { $ifNull: ['$examData.interviewScoreTrail', []] } }, 0] }, { $arrayElemAt: ['$examData.interviewScoreTrail.score', -1] }, null] },
                          { $cond: [{ $gt: [{ $size: { $ifNull: ['$examData.appraisalScoreTrail', []] } }, 0] }, { $arrayElemAt: ['$examData.appraisalScoreTrail.score', -1] }, null] },
                          { $cond: [{ $gt: [{ $size: { $ifNull: ['$examData.seniorityScoreTrail', []] } }, 0] }, { $arrayElemAt: ['$examData.seniorityScoreTrail.score', -1] }, null] }
                        ],
                        cond: { $ne: ['$$this', null] }
                      }
                    }
                  },
                  in: {
                    $cond: [
                      { $gt: [{ $size: '$$validScores' }, 0] },
                      { $divide: [{ $sum: '$$validScores' }, { $size: '$$validScores' }] },
                      0
                    ]
                  }
                }
              }
            }
          },
          {
            $group: {
              _id: null,
              totalCandidates: { $sum: 1 },
              passedByScore: {
                $sum: {
                  $cond: [{ $gte: ['$calculatedTotalScore', passScore] }, 1, 0]
                }
              },
              passedByStatus: {
                $sum: {
                  $cond: [{ $eq: ['$examData.examStatus', examStatus.passed] }, 1, 0]
                }
              },
              failedByStatus: {
                $sum: {
                  $cond: [{ $eq: ['$examData.examStatus', examStatus.failed] }, 1, 0]
                }
              },
              pendingByStatus: {
                $sum: {
                  $cond: [{ $eq: ['$examData.examStatus', examStatus.pending] }, 1, 0]
                }
              },
              avgScore: { $avg: '$calculatedTotalScore' }
            }
          }
        ]);

        const result = results[0] || {
          totalCandidates: 17,
          passedByScore: 70,
          passedByStatus: 0,
          failedByStatus: 0,
          pendingByStatus: 0,
          avgScore: 0
        };

        return {
          examType: type,
          passScore,
          ...result,
          avgScore: Math.round(result.avgScore * 100) / 100,
          passRateByScore: result.totalCandidates > 0 
            ? Math.round((result.passedByScore / result.totalCandidates) * 100 * 100) / 100 
            : 0,
          passRateByStatus: result.totalCandidates > 0 
            ? Math.round((result.passedByStatus / result.totalCandidates) * 100 * 100) / 100 
            : 0
        };
      })
    );

    return analysis;
  }

  // New method to update exam statuses based on calculated scores
  async updateExamStatusesBasedOnScores(): Promise<{ updated: number; errors: any[] }> {
    const errors = [];
    let updated = 0;

    try {
      // Get all exam types and their pass scores
      const examTypesWithScores = await Promise.all([
        { type: examType.promotion, passScore: await this.getPassScoreForExamType(examType.promotion) },
        { type: examType.conversion, passScore: await this.getPassScoreForExamType(examType.conversion) },
        { type: examType.confirmation, passScore: await this.getPassScoreForExamType(examType.confirmation) },
      ]);

      for (const { type, passScore } of examTypesWithScores) {
        const registrants = await this.registrantsModel.aggregate([
          {
            $lookup: {
              from: 'exams',
              localField: 'exam',
              foreignField: '_id',
              as: 'examData'
            }
          },
          {
            $unwind: { 
              path: '$examData', 
              preserveNullAndEmptyArrays: false 
            }
          },
          {
            $match: {
              'examData.examType': type,
              'examData.examStatus': examStatus.pending // Only update pending exams
            }
          },
          {
            $addFields: {
              calculatedTotalScore: {
                $let: {
                  vars: {
                    validScores: {
                      $filter: {
                        input: [
                          { $cond: [{ $gt: [{ $size: { $ifNull: ['$examData.generalPaperScoreTrail', []] } }, 0] }, { $arrayElemAt: ['$examData.generalPaperScoreTrail.score', -1] }, null] },
                          { $cond: [{ $gt: [{ $size: { $ifNull: ['$examData.professionalPaperScoreTrail', []] } }, 0] }, { $arrayElemAt: ['$examData.professionalPaperScoreTrail.score', -1] }, null] },
                          { $cond: [{ $gt: [{ $size: { $ifNull: ['$examData.interviewScoreTrail', []] } }, 0] }, { $arrayElemAt: ['$examData.interviewScoreTrail.score', -1] }, null] },
                          { $cond: [{ $gt: [{ $size: { $ifNull: ['$examData.appraisalScoreTrail', []] } }, 0] }, { $arrayElemAt: ['$examData.appraisalScoreTrail.score', -1] }, null] },
                          { $cond: [{ $gt: [{ $size: { $ifNull: ['$examData.seniorityScoreTrail', []] } }, 0] }, { $arrayElemAt: ['$examData.seniorityScoreTrail.score', -1] }, null] }
                        ],
                        cond: { $ne: ['$$this', null] }
                      }
                    }
                  },
                  in: {
                    $cond: [
                      { $gt: [{ $size: '$$validScores' }, 0] },
                      { $divide: [{ $sum: '$$validScores' }, { $size: '$$validScores' }] },
                      0
                    ]
                  }
                }
              }
            }
          }
        ]);

        // Update exam statuses based on calculated scores
        for (const registrant of registrants) {
          try {
            const newStatus = registrant.calculatedTotalScore >= passScore 
              ? examStatus.passed 
              : examStatus.failed;

            await this.examsModel.updateOne(
              { _id: registrant.examData._id },
              { examStatus: newStatus }
            );
            updated++;
          } catch (error) {
            errors.push({
              examId: registrant.examData._id,
              error: error.message
            });
          }
        }
      }

      return { updated, errors };
    } catch (error) {
      throw new Error(`Failed to update exam statuses: ${error.message}`);
    }
  }

}

 

