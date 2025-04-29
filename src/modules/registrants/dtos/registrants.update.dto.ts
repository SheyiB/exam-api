import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsOptional, IsEnum, IsString, IsDate, IsBoolean, IsMongoId } from 'class-validator';
import { ExamUpdateDto } from 'src/modules/exams/dtos/exams.update.dto'; // Ensure this path matches your project's structure

export class RegistrantUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateOfBirth?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  staffVerificationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  presentRank?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedRank?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  presentGradeLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  presentStep?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedGradeLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateOfPrevAppointment?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateOfConfirmation?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateOfPresentAppointment?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateOfFirstAppointment?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  disability?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ExamUpdateDto)
  exam?: ExamUpdateDto; // Exam fields can be updated here, using ExamUpdateDto

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  profilePassport?: string; // Profile picture field, if needed

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cadre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mda?: string;

// Handle profilePicture as a file (not just a string URL)
  @ApiPropertyOptional({
    description: 'Profile picture of the registrant.',
    type: 'string',  // Make sure this reflects the file path or URL
  })
  @IsOptional()
  profilePicture?: Express.Multer.File;
}
