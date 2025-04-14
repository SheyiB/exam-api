import { ApiProperty } from '@nestjs/swagger';
import { RegistrantCreateDto } from './registrants.create.dto';

export class RegistrantCreateDtoWithFile extends RegistrantCreateDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Profile picture file',
  })
  profilePicture?: any;
}
