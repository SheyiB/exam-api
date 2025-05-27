import { IsEnum, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum ExamType {
  PROMOTION = 'promotion',
  CONVERSION = 'conversion',
  CONFIRMATION = 'confirmation',
}

export class CreateExamScoreDto {
  @ApiProperty({
    description: 'The type of exam',
    enum: ExamType,
    example: ExamType.PROMOTION,
  })
  @IsEnum(ExamType, { message: 'examType must be one of: promotion, conversion, confirmation' })
  @IsNotEmpty({ message: 'examType is required' })
  examType: ExamType;

  @ApiProperty({
    description: 'The pass score threshold (0-100)',
    minimum: 0,
    maximum: 100,
    example: 70,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'passScore must be a number' })
  @Min(0, { message: 'passScore must be at least 0' })
  @Max(100, { message: 'passScore must be at most 100' })
  @IsNotEmpty({ message: 'passScore is required' })
  passScore: number;
}

export class UpdateExamScoreDto {
  @ApiProperty({
    description: 'The pass score threshold (0-100)',
    minimum: 0,
    maximum: 100,
    example: 75,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber({}, { message: 'passScore must be a number' })
  @Min(0, { message: 'passScore must be at least 0' })
  @Max(100, { message: 'passScore must be at most 100' })
  @IsNotEmpty({ message: 'passScore is required' })
  passScore: number;
}