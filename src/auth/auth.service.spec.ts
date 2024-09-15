import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { ApiConfigService } from '../api-config/api-config.service';
import { RolesService } from '../roles/roles.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { Model } from 'mongoose';
import { BlacklistedToken } from './schemas/blacklisted-token.schema';
import { UserDocument } from '../users/schemas/user.schema';

const TEST_USER_ID = 'someId';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password';
const TEST_USER_HASHED_PASSWORD = 'hashedPassword';
const TEST_USER_NAME = 'Test User';
const TEST_JWT_TOKEN = 'jwt_token';
const TEST_INVALID_PASSWORD = 'wrongpassword';
const TEST_NEW_USER_EMAIL = 'newuser@example.com';
const TEST_BLACKLISTED_TOKEN = 'valid_token';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let blacklistedTokenModel: Model<BlacklistedToken>;

  const mockUser: Partial<UserDocument> = {
    _id: TEST_USER_ID,
    email: TEST_USER_EMAIL,
    password: TEST_USER_HASHED_PASSWORD,
    name: TEST_USER_NAME,
    createdAt: new Date(),
    roles: [],
    toObject: jest.fn().mockReturnValue({
      _id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      password: TEST_USER_HASHED_PASSWORD,
      name: TEST_USER_NAME,
      createdAt: expect.any(Date),
      roles: [],
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            validateUser: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            findManyById: jest.fn().mockResolvedValue([{ name: 'user' }]),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ApiConfigService,
          useValue: {
            jwtExpires: '3600',
          },
        },
        {
          provide: getModelToken(BlacklistedToken.name),
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: RolesService,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    blacklistedTokenModel = module.get<Model<BlacklistedToken>>(
      getModelToken(BlacklistedToken.name),
    );
  });

  describe('signIn', () => {
    it('should return a JWT token when credentials are valid', async () => {
      jest
        .spyOn(usersService, 'validateUser')
        .mockResolvedValue(mockUser as UserDocument);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(TEST_JWT_TOKEN);

      const result = await authService.signIn(
        TEST_USER_EMAIL,
        TEST_USER_PASSWORD,
      );

      expect(result).toBe(TEST_JWT_TOKEN);
      expect(usersService.validateUser).toHaveBeenCalledWith(
        TEST_USER_EMAIL,
        TEST_USER_PASSWORD,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: TEST_USER_ID,
          username: TEST_USER_EMAIL,
        }),
      );
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      jest.spyOn(usersService, 'validateUser').mockResolvedValue(null);

      await expect(
        authService.signIn(TEST_USER_EMAIL, TEST_INVALID_PASSWORD),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signUp', () => {
    it('should create a new user when username does not exist', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(usersService, 'create')
        .mockResolvedValue(mockUser as UserDocument);

      const result = await authService.signUp(
        TEST_NEW_USER_EMAIL,
        TEST_USER_PASSWORD,
      );

      expect(result).toEqual({
        _id: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        name: TEST_USER_NAME,
        roles: ['user'],
      });
      expect(usersService.findOne).toHaveBeenCalledWith(TEST_NEW_USER_EMAIL);
      expect(usersService.create).toHaveBeenCalledWith(
        TEST_NEW_USER_EMAIL,
        TEST_USER_PASSWORD,
        TEST_NEW_USER_EMAIL,
        undefined,
      );
    });

    it('should throw ConflictException when username already exists', async () => {
      jest
        .spyOn(usersService, 'findOne')
        .mockResolvedValue(mockUser as UserDocument);

      await expect(
        authService.signUp(TEST_USER_EMAIL, TEST_USER_PASSWORD),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('logout', () => {
    it('should blacklist the token', async () => {
      jest.spyOn(blacklistedTokenModel, 'create').mockResolvedValue(undefined);

      await authService.logout(TEST_BLACKLISTED_TOKEN);

      expect(blacklistedTokenModel.create).toHaveBeenCalledWith({
        token: TEST_BLACKLISTED_TOKEN,
        expiresAt: expect.any(Date),
      });
    });
  });
});
