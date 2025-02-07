import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty } from 'class-validator';
import { ExamCreateDto } from 'src/modules/exams/dtos/exams.create.dto';

export class RegistrantCreateDto {
  @ApiProperty({
    example: 'John',
    description: 'The first name of the registrant',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  surname: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the registrant',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'The middle name of the registrant',
  })
  @IsString()
  middleName: string;

  @ApiProperty({
    example: 'Male',
    description: 'Gender of the registrant',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({
    example: 'Sgt',
    description: 'The current rank of the registrant',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  presentRank: string;

  @ApiProperty({
    example: 'Cpl',
    description: 'The expected rank of the registrant',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  expectedRank: string;

  @ApiProperty({
    example: '2020-01-01',
    description: 'The date of the previous appointment of the registrant',
    required: true,
  })
  @Type(() => Date)
  dateOfPrevAppointment: Date;

  @ApiProperty({
    example: '2020-01-01',
    description: 'The date of the present appointment of the registrant',
    required: true,
  })
  @Type(() => Date)
  dateOfPresentAppointment: Date;

  @ApiProperty({
    example: '2020-01-01',
    description: 'The date of the first appointment of the registrant',
    required: true,
  })
  @Type(() => Date)
  dateOfFirstAppointment: Date;

  @ApiProperty({
    example: false,
    description: 'The disability status of the registrant',
    required: true,
  })
  disability: boolean;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'The profile passport of the registrant',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  profilePassport: string;

  @ApiProperty({
    example: 'chima@absg.gov.ng',
    description: 'The email address of the registrant',
    required: true,
  })
  @IsString()
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

  @ApiProperty({
    description: 'The examination details of the registrant',
    required: true,
    type: ExamCreateDto,
  })
  @Type(() => ExamCreateDto)
  @IsNotEmpty()
  exam: ExamCreateDto;
}
