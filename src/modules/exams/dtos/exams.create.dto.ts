import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum ExamType {
  PROMOTION = 'promotion',
  CONVERSION = 'conversion',
  CONFIRMATION = 'confirmation',
}

export enum ExamStatus {
  PASSED = 'passed',
  FAILED = 'failed',
}

export class ExamCreateDto {
  @ApiProperty({
    example: '2024-02-07',
    description: 'The date of the examination',
    required: true,
  })
  @Type(() => Date)
  examDate: Date;

  @ApiProperty({
    example: 'promotion',
    description: 'Type of examination',
    enum: ExamType,
    required: true,
  })
  @IsEnum(ExamType)
  @IsNotEmpty()
  examType: ExamType;

  @ApiProperty({
    example: 'passed',
    description: 'Status of the examination',
    enum: ExamStatus,
  })
  @IsEnum(ExamStatus)
  @IsString()
  @IsNotEmpty()
  examStatus: ExamStatus;

  @ApiProperty({
    example: 75,
    description: 'Score obtained in general paper',
  })
  @IsNumber()
  @IsNotEmpty()
  generalPaperScore: number;

  @ApiProperty({
    example: 80,
    description: 'Score obtained in professional paper',
  })
  @IsNumber()
  @IsNotEmpty()
  professionalPaperScore: number;

  @ApiProperty({
    example: 155,
    description: 'Total score obtained in the examination',
  })
  @IsNumber()
  @IsNotEmpty()
  totalScore: number;

  @ApiProperty({
    example: 'Excellent performance',
    description: 'Remarks about the examination performance',
  })
  @IsString()
  @IsNotEmpty()
  remark: string;

  @ApiProperty({
    example: 'EX2024001',
    description: 'Unique examination number',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  examNumber: string;
}
