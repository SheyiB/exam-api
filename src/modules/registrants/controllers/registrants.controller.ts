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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RegistrantCreateDto } from '../dtos/registrants.create.dto';
import { PartialType } from '@nestjs/swagger';
import { RegistrantsService } from '../services/registrants.service';
import { IResponse } from 'src/common/response/interface/response.interface';

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

  @ApiOperation({ summary: 'Register a new candidate' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Successfully registered' })
  @HttpCode(HttpStatus.CREATED)
  @Post('/register')
  async register(
    @Body(new ValidationPipe({ transform: true })) 
    registrant: RegistrantCreateDto
  ): Promise<IResponse> {
    const createdRegistrant = await this.registrantsService.createRegistrants(registrant);
    return {
      data: createdRegistrant,
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


  @ApiOperation({ summary: 'Get promotion statistics' })
  @HttpCode(HttpStatus.OK)
  @Get('/levels-status')
  async examStatusByLevel(): Promise<IResponse> {
    const stats = await this.registrantsService.getExamStatusByLevel();

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