import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ExamType } from './exams.create.dto';

export class CreateExamScoreDto {
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
    example: 70,
    description: 'Minimum score required to pass the exam',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  passScore: number;
}

export class UpdateExamScoreDto {
  @ApiProperty({
    example: 75,
    description: 'Updated minimum score required to pass the exam',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  passScore: number;
}