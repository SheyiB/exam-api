import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsEmail, MaxLength, IsOptional } from 'class-validator';
import { IFile } from 'src/common/file/interfaces/file.interface';

export class UserSignupDto {
  @ApiProperty({
    example: faker.person.fullName(),
    description: 'The full name of the user',
    required: true,
  })
  @IsNotEmpty()
  @MaxLength(100)
  @Type(() => String)
  readonly fullname: string;

  @ApiProperty({
    example: faker.commerce.department(),
    description: 'The department the user belongs to',
    required: true,
  })
  @IsNotEmpty()
  @MaxLength(50)
  @Type(() => String)
  readonly department: string;

  @ApiProperty({
    example: faker.name.jobTitle(),
    description: 'The job title of the user',
    required: true,
  })
  @IsNotEmpty()
  @MaxLength(50)
  @Type(() => String)
  readonly jobTitle: string;

  @ApiProperty({
    example: faker.internet.email(),
    description: 'The official work email address of the user',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(100)
  @Type(() => String)
  readonly workEmailAddress: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: `${faker.string.alphanumeric(5).toLowerCase()}${faker.string
      .alphanumeric(5)
      .toUpperCase()}@@!123`,
    required: true,
  })
  @IsNotEmpty()
  @MaxLength(50)
  readonly password: string;


  @ApiProperty({
    description: 'The profile picture of the user',
    required: false,
    type: 'string', // Use string as the type
    format: 'binary', // Specify binary format
  })
  @IsOptional()
  readonly profilePicture: IFile;
}
