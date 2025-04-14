import { Body, Controller, Post, HttpCode, HttpStatus, UseInterceptors, UploadedFile, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserSignupDto } from '../dtos/user.signup';
import { UserLoginDto } from '../dtos/user.login';
import { UserSignupFileDto } from '../dtos/user.signup.file';
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
  
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('profilePicture')) // <-- this is key
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Successfully registered' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UserSignupFileDto })
  async signup(
    @UploadedFile() profilePicture: Express.Multer.File,
    @Body(new ValidationPipe({ transform: true })) data: UserSignupDto,
  ) {
    const userData = {
      ...data,
      profilePicture,
    };

    const createdUser = await this.userService.signup(userData);
    return { data: createdUser };
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
