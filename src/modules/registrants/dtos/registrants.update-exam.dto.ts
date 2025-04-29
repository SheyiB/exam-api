// registrants/dtos/registrant.update-exam.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsOptional } from 'class-validator';
import { ExamUpdateDto } from 'src/modules/exams/dtos/exams.update.dto';

export class RegistrantExamUpdateDto {
  @ApiPropertyOptional({
    description: 'Exam details to update for the registrant',
    type: ExamUpdateDto,
  })
  @ValidateNested()
  @Type(() => ExamUpdateDto)
  @IsOptional()
  exam?: ExamUpdateDto;
}
