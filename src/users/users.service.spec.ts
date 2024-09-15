import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { RolesService } from '../roles/roles.service';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Test constants
const TEST_USER_ID = 'someId';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testPassword';
const TEST_HASHED_PASSWORD = 'hashedPassword';
const TEST_NAME = 'Test User';
const TEST_ROLE_ID = 'someRoleId';
const TEST_ROLE_NAME = 'TestRole';
const TEST_NONEXISTENT_EMAIL = 'nonexistent@example.com';
const TEST_WRONG_PASSWORD = 'wrongpassword';
const TEST_NONEXISTENT_ROLE = 'NonexistentRole';

const mockUser = {
  _id: TEST_USER_ID,
  email: TEST_EMAIL,
  password: TEST_HASHED_PASSWORD,
  name: TEST_NAME,
  roles: [TEST_ROLE_NAME],
};

const mockRole = {
  _id: TEST_ROLE_ID,
  name: TEST_ROLE_NAME,
};

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<User>;
  let rolesService: RolesService;

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockRolesService = {
    findOne: jest.fn(),
    findManyById: jest.fn().mockResolvedValue([{ name: 'user' }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<User>>(getModelToken(User.name));
    rolesService = module.get<RolesService>(RolesService);
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockUser),
      } as any);

      const result = await service.findOne(TEST_EMAIL);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user is not found', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as any);

      const result = await service.findOne(TEST_NONEXISTENT_EMAIL);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a user without a role', async () => {
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue(TEST_HASHED_PASSWORD as never);
      jest.spyOn(model, 'create').mockImplementationOnce(() =>
        Promise.resolve([
          {
            ...mockUser,
            roles: [],
          },
        ] as any),
      );

      const result = await service.create(TEST_EMAIL, TEST_PASSWORD, TEST_NAME);
      expect(result).toEqual([{ ...mockUser, roles: [] }]);
      expect(bcrypt.hash).toHaveBeenCalledWith(TEST_PASSWORD, 10);
    });

    it('should create a user with a role', async () => {
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue(TEST_HASHED_PASSWORD as never);
      jest.spyOn(rolesService, 'findOne').mockResolvedValue(mockRole as any);
      jest
        .spyOn(model, 'create')
        .mockImplementationOnce(() => Promise.resolve([mockUser] as any));

      const result = await service.create(
        TEST_EMAIL,
        TEST_PASSWORD,
        TEST_NAME,
        TEST_ROLE_NAME,
      );
      expect(result).toEqual([{ ...mockUser, roles: [TEST_ROLE_NAME] }]);
      expect(bcrypt.hash).toHaveBeenCalledWith(TEST_PASSWORD, 10);
      expect(rolesService.findOne).toHaveBeenCalledWith(TEST_ROLE_NAME);
    });

    it('should throw NotFoundException if role is not found', async () => {
      jest.spyOn(rolesService, 'findOne').mockResolvedValue(null);

      await expect(
        service.create(
          TEST_EMAIL,
          TEST_PASSWORD,
          TEST_NAME,
          TEST_NONEXISTENT_ROLE,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateUser', () => {
    it('should return a user if credentials are valid', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser(TEST_EMAIL, TEST_PASSWORD);
      expect(result).toEqual(mockUser);
    });

    it('should return null if user is not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      const result = await service.validateUser(
        TEST_NONEXISTENT_EMAIL,
        TEST_PASSWORD,
      );
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      const result = await service.validateUser(
        TEST_EMAIL,
        TEST_WRONG_PASSWORD,
      );
      expect(result).toBeNull();
    });
  });
});
