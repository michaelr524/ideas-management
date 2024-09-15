import {
  Injectable,
  UnauthorizedException,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlacklistedToken } from './schemas/blacklisted-token.schema';
import { ApiConfigService } from '../api-config/api-config.service';
import { UserResponseDto } from './dto/auth.dto';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ApiConfigService,
    private rolesService: RolesService,
    @InjectModel(BlacklistedToken.name)
    private blacklistedTokenModel: Model<BlacklistedToken>,
  ) {}

  private async getUserRoleNames(user: any): Promise<string[]> {
    if (!user.roles || user.roles.length === 0) {
      return ['user']; // Default role if no roles are assigned
    }
    const roleIds = user.roles.map((roleId) => roleId.toString());
    const roles = await this.rolesService.findManyById(roleIds);
    return roles.map((role) => role.name);
  }

  async getUserProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roleNames = await this.getUserRoleNames(user);

    return {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      roles: roleNames,
    };
  }

  async signIn(username: string, password: string): Promise<string> {
    this.logger.log(`Attempting to sign in user: ${username}`);

    const user = await this.usersService.validateUser(username, password);

    if (!user) {
      this.logger.warn(
        `Sign in failed: Invalid credentials for user ${username}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id.toString(),
      username: user.email,
      _id: user._id.toString(),
    };
    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.log(`User ${username} successfully signed in`);

    return accessToken;
  }

  async signUp(
    username: string,
    password: string,
    role?: string,
  ): Promise<UserResponseDto> {
    this.logger.log(`Attempting to sign up user: ${username}`);

    const existingUser = await this.usersService.findOne(username);
    if (existingUser) {
      this.logger.warn(`Sign up failed: User already exists - ${username}`);
      throw new ConflictException('User already exists');
    }

    const user = await this.usersService.create(
      username,
      password,
      username,
      role,
    );

    this.logger.log(`User ${username} successfully signed up`);

    const roleNames = await this.getUserRoleNames(user);

    return {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      roles: roleNames,
    };
  }

  async logout(token: string): Promise<void> {
    this.logger.log('Attempting to log out user');

    const expiresAt = new Date(
      Date.now() + this.configService.jwtExpires * 1000,
    );

    await this.blacklistedTokenModel.create({ token, expiresAt });

    this.logger.log('User successfully logged out');
  }
}
