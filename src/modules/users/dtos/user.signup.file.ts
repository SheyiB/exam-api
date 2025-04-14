import { ApiProperty } from "@nestjs/swagger";
import { UserSignupDto } from './user.signup';

export class UserSignupFileDto extends UserSignupDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Profile picture file',
  })
  profilePicture?: any;
}