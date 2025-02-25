import { Body, Controller, Post, HttpCode, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserSignupDto } from '../dtos/user.signup';
import { UserLoginDto } from '../dtos/user.login';
import { UserService } from '../services/user.service';
import { IResponse } from 'src/common/response/interface/response.interface';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('auth')
@Controller({
  version: '1',
  path: '/exam-api/auth',
})
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) { }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullname: { type: 'string' },
        department: { type: 'string' },
        jobTitle: { type: 'string' },
        workEmailAddress: { type: 'string' },
        password: { type: 'string' },
        profilePicture: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  @UseInterceptors(FileInterceptor('profilePicture', {
    // Add file filter to check file type if needed
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/)) {
        return callback(new Error('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
    // Add limits if needed
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  }))
  async signup(
    @Body() data: UserSignupDto,
    @UploadedFile() profilePicture: Express.Multer.File
  ): Promise<IResponse> {
    // Make sure the DTO and file objects are correctly merged
    const userData = {
      ...data,
      profilePicture: profilePicture
    };

    const createdUser = await this.userService.signup(userData);
    
    return {
      data: createdUser,
    };
  }

  @Post('login')
  async login(@Body() userData: UserLoginDto): Promise<IResponse> {
    const { token, email, userName} = await this.userService.login(userData);
    return {
      data: {
        token,
        email,
        userName
      },
    };
  }
}
