import { UserDoc } from '../repository/entities/user.entity';
import { UserSignupDto } from '../dtos/user.signup';
import { UserLoginDto } from '../dtos/user.login';

export interface IUserService {
  signup(data: UserSignupDto): Promise<Partial<UserDoc>>;
  login(data: UserLoginDto): Promise<string>;
  getAllUsers(): Promise<Partial<UserDoc>[]>;
  getUserById(userId: string): Promise<Partial<UserDoc>>;
  deleteUser(userId: string): Promise<void>;
}
