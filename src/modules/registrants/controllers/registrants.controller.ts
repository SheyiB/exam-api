import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Put,
  Param,
  Query,
  Delete,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { RegistrantCreateDto } from '../dtos/registrants.create.dto';
import { RegistrantCreateDtoWithFile } from '../dtos/registrants.createWithFile.dto';
import { PartialType } from '@nestjs/swagger';
import { RegistrantsService } from '../services/registrants.service';
import { IResponse } from 'src/common/response/interface/response.interface';
import { examType } from 'src/modules/exams/repository/entities/exams.entity';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @Put('/:registrantId')
  async updateRegistrant(
     @Body(new ValidationPipe({ transform: true })) 
    registrant: Partial<RegistrantCreateDto>,
    @Param('registrantId') registrantId: string,
   
  ): Promise<IResponse> {
    const updatedRegistrant = await this.registrantsService.updateRegistrants(
      registrantId,
      registrant,
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
}