import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString, IsOptional, IsEmpty } from 'class-validator';
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
  @IsNotEmpty()
  examDate: Date;

  @ApiProperty({
    example: 'promotion',
    description: 'Type of examination',
    enum: ExamType,
    required: true,
  })
  @IsEnum(ExamType)
  @IsString()
    @IsNotEmpty()
  examType: ExamType;

  @ApiProperty({
    example: 'passed',
    description: 'Status of the examination',
    enum: ExamStatus,
  })
  @IsEnum(ExamStatus)
  @IsString()
    @IsOptional()
  examStatus: ExamStatus;

  @ApiProperty({
    example: 75,
    description: 'Score obtained in general paper',
  })
  @IsNumber()
    @IsOptional()
  generalPaperScore: number;

  @ApiProperty({
    example: 80,
    description: 'Score obtained in professional paper',
  })
  @IsNumber()
    
    @IsOptional()
  professionalPaperScore: number;


  @IsEmpty()
  totalScore: number;


  @ApiProperty({
    example: 'Excellent performance',
    description: 'Remarks about the examination performance',
  })
  @IsString()
    
    @IsOptional()
  remark: string;

  @ApiProperty({
    example: 'EX2024001',
    description: 'Unique examination number',
    required: true,
  })
  @IsString()
    
  @IsOptional()
    @IsEmpty()
  examNumber: string;

}
