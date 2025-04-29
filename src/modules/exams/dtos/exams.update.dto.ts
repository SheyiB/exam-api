import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ExamStatus, ExamType } from './exams.create.dto';
import { Type } from 'class-transformer';

export class ExamUpdateDto {
  @ApiPropertyOptional()
  @Type(() => Date)
  @IsOptional()
  examDate?: Date;

  @ApiPropertyOptional({ enum: ExamType })
  @IsEnum(ExamType)
  @IsOptional()
  examType?: ExamType;

  @ApiPropertyOptional({ enum: ExamStatus })
  @IsEnum(ExamStatus)
  @IsOptional()
  examStatus?: ExamStatus;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  generalPaperScore?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  professionalPaperScore?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  interviewScore?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  appraisalScore?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  seniorityScore?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  remark?: string;

 
}
