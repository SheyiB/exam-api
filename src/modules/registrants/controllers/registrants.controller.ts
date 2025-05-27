import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Put,
  Param,
  Patch,
  Query,
  Delete,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegistrantCreateDto } from '../dtos/registrants.create.dto';
import { RegistrantCreateDtoWithFile } from '../dtos/registrants.createWithFile.dto';
import { PartialType } from '@nestjs/swagger';
import { RegistrantsService } from '../services/registrants.service';
import { IResponse } from 'src/common/response/interface/response.interface';
import { examType } from 'src/modules/exams/repository/entities/exams.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/common/auth/auth.guard';
import { RegistrantExamUpdateDto } from '../dtos/registrants.update-exam.dto';
import { Request } from 'express';

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

interface User {
  userId: string;
  username: string;
  roles: string[];
}

class PaginationQueryDto {
  page?: string;
  limit?: string;
  mda?: string;
  gender?: string;
  presentRank?: string;
  expectedRank?: string;
  'exam.examType'?: string;
  'exam.examStatus'?: string;
}

@ApiTags('exam')
@Controller({
  version: '1',
  path: '/exam-api',
})
@ApiBearerAuth()
export class RegistrantsController {
  constructor(private readonly registrantsService: RegistrantsService) {}
  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new candidate' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Successfully registered' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profilePicture'))
  @ApiBody({
    description: 'Registration payload including profile picture',
    type: RegistrantCreateDtoWithFile,
  })
  async register(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ValidationPipe({ transform: true })) registrant: RegistrantCreateDto,
   ): Promise<any> {
  
    const created = await this.registrantsService.createRegistrants({
      ...registrant,
      profilePicture: file,
    });

    return {
      message: 'Successfully registered',
      data: created,
    };
  }

  @ApiOperation({ summary: 'Update registrant details' })
  @ApiBody({ type: PartialType(RegistrantCreateDto) }) 
  @ApiParam({ name: 'registrantId', description: 'Registrant ID' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard) 
  @Put('/:registrantId')
  async updateRegistrant(
     @Body(new ValidationPipe({ transform: true })) 
    registrant: Partial<RegistrantCreateDto>,
    @Param('registrantId') registrantId: string,
      @CurrentUser() user: User
   
  ): Promise<IResponse> {
    const updatedRegistrant = await this.registrantsService.updateRegistrant(
      registrantId,
      registrant,
      user.userId
    );

    return {
      data: updatedRegistrant,
    };
  }

  @ApiOperation({ summary: 'Update registrant exam details only' })
  @ApiBody({ type: RegistrantExamUpdateDto })
  @ApiParam({ name: 'registrantId', description: 'Registrant ID' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Patch('/:registrantId/exam')
  async updateRegistrantExam(
    @Body(new ValidationPipe({ transform: true }))
    registrantExamDto: RegistrantExamUpdateDto,
    @Param('registrantId') registrantId: string,
    @CurrentUser() user: User,
  ): Promise<IResponse> {

    const updatedRegistrant = await this.registrantsService.updateRegistrantExam(
      registrantId,
      registrantExamDto,
      user.userId,
    );

    return {
      data: updatedRegistrant,
    };
  }



  @ApiOperation({ summary: 'Get all registrants with pagination' })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'mda', required: false, type: String })
  @ApiQuery({ name: 'gender', required: false, type: String })
  @ApiQuery({ name: 'presentRank', required: false, type: String })
  @ApiQuery({ name: 'expectedRank', required: false, type: String })
  @ApiQuery({ name: 'exam.examType', required: false, type: String })
  @ApiQuery({ name: 'exam.examStatus', required: false, type: String })
  @ApiQuery({ name: 'cadre', required: false, type: String })
  @ApiQuery({ name: 'presentGradeLevel', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })  
  @HttpCode(HttpStatus.OK)
  @Get('/')
  async allRegistrants(
    @Query(new ValidationPipe({ transform: true })) 
    query: PaginationQueryDto
  ): Promise<IResponse> {
    const { data, pagination} = await this.registrantsService.findAllRegistrants(query);

    return {
      data: {
        data,
        pagination,
      }
    };
  }

  @ApiOperation({ summary: 'Get registrant details by ID' })
  @ApiParam({ name: 'registrantId', description: 'Registrant ID' })
  @HttpCode(HttpStatus.OK)
  @Get('/registrant/:registrantId')
  async registrantDetails(
    @Param('registrantId') registrantId: string
  ): Promise<IResponse> {
    const registrant = await this.registrantsService.findOneRegistrant(registrantId);

    return {
      data: registrant,
    };
  }

  @ApiOperation({ summary: 'Delete a registrant' })
  @ApiParam({ name: 'registrantId', description: 'Registrant ID' })
  @HttpCode(HttpStatus.OK)
  @Delete('/:registrantId')
  async removeRegistrant(
    @Param('registrantId') registrantId: string
  ): Promise<IResponse> {
    await this.registrantsService.removeRegistrant(registrantId);

    return {
      data: {
        message: 'Registrant deleted successfully',
      }
    };
  }

  @ApiOperation({ summary: 'Get dashboard statistics' })
  @HttpCode(HttpStatus.OK)
  @Get('/dashboard')
  async dashboard(): Promise<IResponse> {
    const stats = await this.registrantsService.registrantStats();

    return {
      data: stats,
    };
  }

  @ApiOperation({ summary: 'Get promotion statistics' })
  @HttpCode(HttpStatus.OK)
  @Get('/promotion-stats')
  async promotionStats(): Promise<IResponse> {
    const stats = await this.registrantsService.registrantByPromotion();

    return {
      data: stats,
    };
  }


 @ApiOperation({ summary: 'Get exam statistics by level' })
@ApiQuery({
  name: 'examType',
  required: false,
  enum: examType,
  description: 'Filter statistics by exam type (optional)'
})
@HttpCode(HttpStatus.OK)
@Get('/levels-status')
async examStatusByLevel(@Query('examType') examType?: examType): Promise<IResponse> {
  const stats = await this.registrantsService.getExamStatusByLevel(examType);
  
  return {
    data: stats,
  };
}

  @ApiOperation({ summary: 'Get passed registrants' })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'mda', required: false, type: String })
  @ApiQuery({ name: 'gender', required: false, type: String })
  @ApiQuery({ name: 'presentRank', required: false, type: String })
  @ApiQuery({ name: 'expectedRank', required: false, type: String })
  @ApiQuery({ name: 'exam.examType', required: false, type: String })
  @ApiQuery({ name: 'exam.examStatus', required: false, type: String })
  @ApiQuery({ name: 'cadre', required: false, type: String })
  @ApiQuery({ name: 'presentGradeLevel', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })

  @HttpCode(HttpStatus.OK)
  @Get('/status/passed')
  async getPasses(
     @Query(new ValidationPipe({ transform: true })) 
    query: PaginationQueryDto
  ): Promise<IResponse> {
    const registrants = await this.registrantsService.getRegistrantsByStatus('passed', query);

    return {
      data: registrants,
    };
  }

  @ApiOperation({ summary: 'Get failed registrants' })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'mda', required: false, type: String })
  @ApiQuery({ name: 'gender', required: false, type: String })
  @ApiQuery({ name: 'presentRank', required: false, type: String })
  @ApiQuery({ name: 'expectedRank', required: false, type: String })
  @ApiQuery({ name: 'exam.examType', required: false, type: String })
  @ApiQuery({ name: 'exam.examStatus', required: false, type: String })
  @ApiQuery({ name: 'cadre', required: false, type: String })
  @ApiQuery({ name: 'presentGradeLevel', required: false, type: String })
    @ApiQuery({ name: 'search', required: false, type: String })
  
  @HttpCode(HttpStatus.OK)
  @Get('/status/failed')
  async getFailures(
     @Query(new ValidationPipe({ transform: true })) 
    query: PaginationQueryDto
  ): Promise<IResponse> {
    const registrants = await this.registrantsService.getRegistrantsByStatus('failed', query);

    return {
      data: registrants,
    };
  }

  @ApiOperation({ summary: 'Get registrants with disabilities' })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'mda', required: false, type: String })
  @ApiQuery({ name: 'gender', required: false, type: String })
  @ApiQuery({ name: 'presentRank', required: false, type: String })
  @ApiQuery({ name: 'expectedRank', required: false, type: String })
  @ApiQuery({ name: 'exam.examType', required: false, type: String })
  @ApiQuery({ name: 'exam.examStatus', required: false, type: String })
  @ApiQuery({ name: 'cadre', required: false, type: String })
  @ApiQuery({ name: 'presentGradeLevel', required: false, type: String })
    @ApiQuery({ name: 'search', required: false, type: String })
  
  @HttpCode(HttpStatus.OK)
  @Get('/status/incapacitated')
  async getDisabled(
      @Query(new ValidationPipe({ transform: true })) 
      query: PaginationQueryDto
  ): Promise<IResponse> {
    const registrants = await this.registrantsService.getRegistrantsByStatus('incapacitated', query);

    return {
      data: registrants,
    };
  }

  @Get('analysis/pass-fail-by-type')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed pass/fail analysis by exam type' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved pass/fail analysis.'
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.'
  })
  async getPassFailAnalysisByExamType(): Promise<IResponse> {
    const analysis = await this.registrantsService.getPassFailAnalysisByExamType();
    
    return {
      data: analysis
    };
  }

  @Get('analysis/scores-by-type')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get average scores by exam type with pass score information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved average scores analysis.'
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.'
  })
  async getAverageScoresByExamType(): Promise<IResponse> {
    const scores = await this.registrantsService.getAverageScoresByExamType();
    
    return {
      data: scores
    };
  }
}