import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { ApiConfigService } from '../api-config/api-config.service';
import { BlacklistedToken } from './schemas/blacklisted-token.schema';

const TEST_JWT_SECRET = 'testSecret';
const TEST_USER_ID = '123';
const VALID_TOKEN = 'valid_token';
const INVALID_TOKEN = 'invalid_token';
const BLACKLISTED_TOKEN = 'blacklisted_token';

const mockJwtService = {
  verifyAsync: jest.fn(),
};

const mockConfigService = {
  jwtSecret: TEST_JWT_SECRET,
};

const mockReflector = {
  getAllAndOverride: jest.fn(),
};

const mockBlacklistedTokenModel = {
  exists: jest.fn(),
};

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockExecutionContext: ExecutionContext;
  let mockHttpArgumentsHost: any;
  let mockRequest: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ApiConfigService, useValue: mockConfigService },
        { provide: Reflector, useValue: mockReflector },
        {
          provide: getModelToken(BlacklistedToken.name),
          useValue: mockBlacklistedTokenModel,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);

    mockRequest = {
      headers: {},
    };
    mockHttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
    };
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  });

  describe('canActivate', () => {
    it('should allow access for public endpoints', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token is blacklisted', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers.authorization = `Bearer ${BLACKLISTED_TOKEN}`;
      mockBlacklistedTokenModel.exists.mockResolvedValue(true);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockBlacklistedTokenModel.exists).toHaveBeenCalledWith({
        token: BLACKLISTED_TOKEN,
      });
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers.authorization = `Bearer ${INVALID_TOKEN}`;
      mockBlacklistedTokenModel.exists.mockResolvedValue(false);
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(INVALID_TOKEN, {
        secret: TEST_JWT_SECRET,
      });
    });

    it('should allow access and set user in request when token is valid', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers.authorization = `Bearer ${VALID_TOKEN}`;
      mockBlacklistedTokenModel.exists.mockResolvedValue(false);
      mockJwtService.verifyAsync.mockResolvedValue({ userId: TEST_USER_ID });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest['user']).toEqual({ userId: TEST_USER_ID });
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(VALID_TOKEN, {
        secret: TEST_JWT_SECRET,
      });
    });
  });
});
