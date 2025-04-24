import { Body, Controller, Post, Put, Get, Param, HttpCode, HttpStatus, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ExamsService } from '../services/exams.service';
import { ExamPassScore } from '../repository/entities/exam.passScore.entity';
import { IResponse } from 'src/common/response/interface/response.interface';
import { CreateExamScoreDto, UpdateExamScoreDto } from '../dtos/exams.pass-score.dto';
import { ExamType } from '../dtos/exams.create.dto';

@ApiTags('exams')
@Controller({
  version: '1',
  path: '/exam-api/exams',
})
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post('pass-score')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an exam pass score' })
  @ApiBody({ type: CreateExamScoreDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The exam pass score has been successfully created.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error.' 
  })
  async createExamScore(
    @Body(new ValidationPipe({ transform: true })) data: CreateExamScoreDto,
  ): Promise<IResponse> {
    const { examType, passScore } = data;
    const createdExamScore = await this.examsService.createExamScore(examType, passScore);
    
    return {
      data: createdExamScore
    };
  }

  @Get('pass-scores')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all exam pass scores' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Successfully retrieved all exam pass scores.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error.' 
  })
  async getAllExamPassScores(): Promise<IResponse> {
    const examPassScores = await this.examsService.getAllExamPassScores();
    
    return {
      data: examPassScores
    };
  }

  @Put('pass-score/:examType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an exam pass score' })
  @ApiParam({ 
    name: 'examType', 
    description: 'The type of exam',
    enum: ExamType,
    example: ExamType.PROMOTION
  })
  @ApiBody({ type: UpdateExamScoreDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'The exam pass score has been successfully updated.' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Exam score not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error.' 
  })
  async updateExamScore(
    @Param('examType') examType: ExamType,
    @Body(new ValidationPipe({ transform: true })) data: UpdateExamScoreDto,
  ): Promise<IResponse> {
    const { passScore } = data;
    const updatedScore = await this.examsService.updateExamScore(
      examType,
      passScore,
    );

    return {
      data: updatedScore
    };
  }


   @Get('pass-score/:examType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific exam pass score by exam type' })
  @ApiParam({ 
    name: 'examType', 
    description: 'The type of exam',
    enum: ExamType,
    example: ExamType.PROMOTION
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Successfully retrieved the exam pass score.' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Exam pass score not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Internal server error.' 
  })
  async getExamPassScore(
    @Param('examType') examType: string,
  ): Promise<IResponse> {
    const examPassScore = await this.examsService.getExamPassScore(examType);
    
    return {
      data: examPassScore
    };
  }
}