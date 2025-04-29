import { UserSignupDto } from '../dtos/user.signup';
import { UserLoginDto } from '../dtos/user.login';
import { IUserService } from '../interfaces/user.service.interface';
import { UserDoc, UserEntity } from '../repository/entities/user.entity';
import { UnprocessableEntityException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ENUM_REQUEST_STATUS_CODE_ERROR,
  ENUM_RESPONSE_MESSAGE,
} from 'src/common/constants';
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryStorageService } from 'src/common/cloudinary/services/cloudinary.storage.service';

@Injectable()
export class UserService implements IUserService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserDoc>,
    private readonly jwtService: JwtService,
    private readonly cloudinaryStorageService: CloudinaryStorageService,
  ) {}

  async signup(data: UserSignupDto & { profilePicture?: Express.Multer.File }): Promise<Partial<UserDoc>> {
    let profilePictureUrl: string | undefined;

    const existingUser = await this.userModel.findOne({
      workEmailAddress: data.workEmailAddress,
    });

    if (existingUser) {
      throw new UnprocessableEntityException({
        statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
        message: ENUM_RESPONSE_MESSAGE.USER_EXIST,
      });
    }

    const hashedPassword = await this.hashPassword(data.password);

    // Only upload if profilePicture exists and has the expected properties
    if (data.profilePicture ) {
      try {
      
        profilePictureUrl = await this.cloudinaryStorageService.uploadFile(
          data.fullname,
          data.profilePicture
        );
      } catch (error) {
        console.error('Profile picture upload failed:', error);
        // Continue with user creation even if image upload fails
        // You could throw an error here instead if image upload is critical
      }
    }

    const user = new this.userModel({
      ...data,
      password: hashedPassword,
      profilePicture: profilePictureUrl,
    });

    const createdUser = await this.userModel.create(user);

    return {
      _id: createdUser._id,
      fullname: createdUser.fullname,
      department: createdUser.department,
      jobTitle: createdUser.jobTitle,
      workEmailAddress: createdUser.workEmailAddress,
      profilePicture: createdUser.profilePicture,
    };
  }
  async login(data: UserLoginDto): Promise<{ token: string; userName: string; email: string }> {
    const user = await this.userModel.findOne({
      workEmailAddress: data.email,
    });

    if (!user) {
      throw new UnprocessableEntityException({
        statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
        message: ENUM_RESPONSE_MESSAGE.USER_NOT_FOUND,
      });
    }

    const isPasswordMatch = await this.comparePassword(
      data.password,
      user.password,
    );

    if (!isPasswordMatch) {
      throw new UnprocessableEntityException({
        statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
        message: ENUM_RESPONSE_MESSAGE.INVALID_PASSWORD,
      });
    }
    const payload = {
      sub: user._id,
      email: user.workEmailAddress,
      fullname: user.fullname,
      department: user.department,
      jobTitle: user.jobTitle,
    };

    const token = this.jwtService.sign(payload);

    const userName = user.fullname;
    const email = user.workEmailAddress;

    return {
      token,
      userName,
      email,
    };
  }

  async findUser(id: string): Promise<Partial<UserDoc>> { 
    const user = await this.userModel.findOne({ $or: [{ _id: id }, { workEmailAddress: id }] });

    if (!user) {
      throw new UnprocessableEntityException({
        statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
        message: ENUM_RESPONSE_MESSAGE.USER_NOT_FOUND,
      });
    }

    return {
      _id: user._id,
      fullname: user.fullname,
      department: user.department,
      jobTitle: user.jobTitle,
      workEmailAddress: user.workEmailAddress,
    };
  }

  async getAllUsers(): Promise<Partial<UserDoc>[]> {
    return await this.userModel.find();
  }

  async getUserById(userId: string): Promise<Partial<UserDoc>> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new UnprocessableEntityException({
        statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
        message: ENUM_RESPONSE_MESSAGE.USER_NOT_FOUND,
      });
    }

    return {
      _id: user._id,
      fullname: user.fullname,
      department: user.department,
      jobTitle: user.jobTitle,
      workEmailAddress: user.workEmailAddress,
    };
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new UnprocessableEntityException({
        statusCode: ENUM_REQUEST_STATUS_CODE_ERROR.REQUEST_VALIDATION_ERROR,
        message: ENUM_RESPONSE_MESSAGE.USER_NOT_FOUND,
      });
    }

    await this.userModel.findByIdAndDelete(userId);
  }

  async hashPassword(password: string): Promise<string> {
    const salt = genSaltSync(10);

    return hashSync(password, salt);
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return compareSync(password, hashedPassword);
  }
}
