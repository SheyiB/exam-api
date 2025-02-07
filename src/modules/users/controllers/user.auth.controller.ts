import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserSignupDto } from '../dtos/user.signup';
import { UserLoginDto } from '../dtos/user.login';
import { UserService } from '../services/user.service';
import { IResponse } from 'src/common/response/interface/response.interface';

@ApiTags('auth')
@Controller({
  version: '1',
  path: '/exam-api/auth',
})
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  async signup(@Body() data: UserSignupDto): Promise<IResponse> {
    const createdUser = await this.userService.signup(data);
    return {
      data: createdUser,
    };
  }

  @Post('login')
  async login(@Body() userData: UserLoginDto): Promise<IResponse> {
    const token = await this.userService.login(userData);
    return {
      data: {
        token,
      },
    };
  }
}
