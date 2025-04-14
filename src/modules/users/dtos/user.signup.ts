import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsEmail, MaxLength, IsOptional } from 'class-validator';
import { IFile } from 'src/common/file/interfaces/file.interface';

export class UserSignupDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsNotEmpty()
  @MaxLength(100)
  readonly fullname: string;

  @ApiProperty({ example: 'Engineering', description: 'Department' })
  @IsNotEmpty()
  @MaxLength(50)
  readonly department: string;

  @ApiProperty({ example: 'Software Engineer', description: 'Job Title' })
  @IsNotEmpty()
  @MaxLength(50)
  readonly jobTitle: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Work Email' })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  readonly workEmailAddress: string;

  @ApiProperty({ example: 'Secret123@@!', description: 'Password' })
  @IsNotEmpty()
  @MaxLength(50)
  readonly password: string;
}
