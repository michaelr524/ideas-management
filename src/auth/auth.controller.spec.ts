import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RolesService } from '../roles/roles.service';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SignUpDto, SignInDto } from './dto/auth.dto';

const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password123';
const TEST_USER_ROLE = 'user';
const TEST_USER_ID = '1';
const TEST_JWT_TOKEN = 'mock.jwt.token';

const MOCK_USER = {
  id: TEST_USER_ID,
  email: TEST_USER_EMAIL,
  role: TEST_USER_ROLE,
};
const MOCK_SIGN_UP_DTO: SignUpDto = {
  username: TEST_USER_EMAIL,
  password: TEST_USER_PASSWORD,
  role: TEST_USER_ROLE,
};
const MOCK_SIGN_IN_DTO: SignInDto = {
  username: TEST_USER_EMAIL,
  password: TEST_USER_PASSWORD,
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    logout: jest.fn(),
    getUserProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
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

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  describe('signUp', () => {
    it('should create a new user', async () => {
      mockAuthService.signUp.mockResolvedValue(MOCK_USER);

      const result = await controller.signUp(MOCK_SIGN_UP_DTO);

      expect(result).toEqual({
        message: 'User successfully created',
        user: MOCK_USER,
      });
      expect(authService.signUp).toHaveBeenCalledWith(
        MOCK_SIGN_UP_DTO.username,
        MOCK_SIGN_UP_DTO.password,
        MOCK_SIGN_UP_DTO.role,
      );
    });

    it('should throw ConflictException when user already exists', async () => {
      mockAuthService.signUp.mockRejectedValue(
        new ConflictException('User already exists'),
      );

      await expect(controller.signUp(MOCK_SIGN_UP_DTO)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException for invalid input', async () => {
      const invalidDto = { ...MOCK_SIGN_UP_DTO, username: 'invalid-email' };
      mockAuthService.signUp.mockRejectedValue(
        new BadRequestException('Invalid email'),
      );

      await expect(controller.signUp(invalidDto as SignUpDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('signIn', () => {
    it('should return a token when credentials are valid', async () => {
      mockAuthService.signIn.mockResolvedValue(TEST_JWT_TOKEN);

      const result = await controller.signIn(MOCK_SIGN_IN_DTO);

      expect(result).toEqual({ token: TEST_JWT_TOKEN });
      expect(authService.signIn).toHaveBeenCalledWith(
        MOCK_SIGN_IN_DTO.username,
        MOCK_SIGN_IN_DTO.password,
      );
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockAuthService.signIn.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.signIn(MOCK_SIGN_IN_DTO)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return the user profile', async () => {
      const mockUser = { _id: '1', username: 'testuser' };
      const mockRequest = { user: { _id: '1' } };
      mockAuthService.getUserProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
      expect(authService.getUserProfile).toHaveBeenCalledWith('1');
    });

    it('should throw UnauthorizedException when user is not authenticated', () => {
      const mockRequest = { user: undefined };

      expect(() => controller.getProfile(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout the user successfully', async () => {
      const mockRequest = {
        headers: {
          authorization: `Bearer ${TEST_JWT_TOKEN}`,
        },
      };
      mockAuthService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(mockRequest);

      expect(result).toEqual({ message: 'Logout successful' });
      expect(authService.logout).toHaveBeenCalledWith(TEST_JWT_TOKEN);
    });

    it('should throw UnauthorizedException when token is missing', async () => {
      const mockRequest = {
        headers: {},
      };

      await expect(controller.logout(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };
      mockAuthService.logout.mockRejectedValue(
        new UnauthorizedException('Invalid token'),
      );

      await expect(controller.logout(mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
