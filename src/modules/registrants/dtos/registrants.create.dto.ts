import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsBoolean, IsEmail, IsOptional, IsDate, ValidateNested, IsArray, Length, Matches,  } from 'class-validator';
import { ExamCreateDto } from 'src/modules/exams/dtos/exams.create.dto';

export class QualificationDto {
  @ApiProperty({
    example: 'Bachelor of Science',
    description: 'The qualification title',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  qualification: string;

  @ApiProperty({
    example: '2020-01-01',
    description: 'The date when the qualification was obtained',
    required: true,
  })
  @IsDate()
  @Type(() => Date)
  dateOfQualification: Date;
}

export class RegistrantCreateDto {
  @ApiProperty({
    example: 'Doe',
    description: 'The surname of the registrant',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  surname: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the registrant',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({
    example: 'James',
    description: 'The middle name of the registrant',
  })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiPropertyOptional({
    example: '1990-01-01',
    description: 'The date of birth of the registrant',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateOfBirth?: Date;

  @ApiPropertyOptional({
    example: 'SVN123456',
    description: 'The staff verification number of the registrant',
  })
  @IsString()
  @IsOptional()
  staffVerificationNumber?: string;

  @ApiProperty({
    example: '12345678901',
    description: 'National Identification Number (NIN) - must be exactly 11 digits',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, { message: 'NIN must be exactly 11 characters' })
  @Matches(/^\d{11}$/, { message: 'NIN must contain only digits' })
  nin: string;

  @ApiProperty({
    example: 'Male',
    description: 'Gender of the registrant',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({
    example: 'Sergeant',
    description: 'The current rank of the registrant',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  presentRank: string;

  @ApiPropertyOptional({
    example: 'Inspector',
    description: 'The expected rank of the registrant',
  })
  @IsString()
  @IsOptional()
  expectedRank?: string;

  @ApiPropertyOptional({
    example: 'GL-8',
    description: 'The present grade level of the registrant',
  })
  @IsString()
  @IsOptional()
  presentGradeLevel?: string;

  @ApiPropertyOptional({
    example: '5',
    description: 'The present step of the registrant',
  })
  @IsString()
  @IsOptional()
  presentStep?: string;

  @ApiPropertyOptional({
    example: 'GL-9',
    description: 'The expected grade level of the registrant',
  })
  @IsString()
  @IsOptional()
  expectedGradeLevel?: string;

  @ApiPropertyOptional({
    example: '2020-01-01',
    description: 'The date of the previous appointment of the registrant',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateOfPrevAppointment?: Date;

  @ApiPropertyOptional({
    example: '2018-01-01',
    description: 'The date of confirmation of the registrant',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateOfConfirmation?: Date;

  @ApiPropertyOptional({
    example: '2020-01-01',
    description: 'The date of the present appointment of the registrant',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateOfPresentAppointment?: Date;

  @ApiPropertyOptional({
    example: '2015-01-01',
    description: 'The date of the first appointment of the registrant',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateOfFirstAppointment?: Date;

  @ApiProperty({
    example: false,
    description: 'The disability status of the registrant',
    required: true,
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  disability: boolean;

  @ApiPropertyOptional({
    type: [QualificationDto],
    description: 'The qualifications of the registrant',
  })
    @Transform(({ value }) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
})
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => QualificationDto)
  @IsOptional()
  qualifications?: QualificationDto[];

  @ApiPropertyOptional({
    example: 'https://example.com/profile.jpg',
    description: 'The profile passport of the registrant',
  })
  @IsString()
  @IsOptional()
  profilePassport?: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The email address of the registrant',
    required: true,
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '08012345678',
    description: 'The phone number of the registrant',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 'Inspector',
    description: 'The cadre of the registrant',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  cadre: string;

  @ApiProperty({
    example: 'Ministry of Finance',
    description: 'The MDA of the registrant',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  mda: string;

  @ApiPropertyOptional({
    description: 'The examination details of the registrant',
    type: ExamCreateDto,
  })
    @Transform(({ value }) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
})
  @ValidateNested()
  @Type(() => ExamCreateDto)
  @IsOptional()
  exam?: ExamCreateDto;
}