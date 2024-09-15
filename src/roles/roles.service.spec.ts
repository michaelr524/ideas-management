import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from './schemas/role.schema';

const TEST_ROLE_NAME = 'TestRole';
const NEW_ROLE_NAME = 'NewTestRole';
const NON_EXISTENT_ROLE = 'NonExistentRole';

describe('RolesService', () => {
  let service: RolesService;

  const mockRole = {
    name: TEST_ROLE_NAME,
  };

  const mockRoleModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getModelToken(Role.name),
          useValue: mockRoleModel,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  describe('create', () => {
    it('should create a new role', async () => {
      mockRoleModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockRoleModel.create.mockResolvedValue(mockRole);

      const result = await service.create(TEST_ROLE_NAME);

      expect(result).toEqual(mockRole);
      expect(mockRoleModel.findOne).toHaveBeenCalledWith({
        name: TEST_ROLE_NAME,
      });
      expect(mockRoleModel.create).toHaveBeenCalledWith({
        name: TEST_ROLE_NAME,
      });
    });

    it('should throw ConflictException if role already exists', async () => {
      mockRoleModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRole),
      });

      await expect(service.create(TEST_ROLE_NAME)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of roles', async () => {
      const mockRoles = [mockRole];
      mockRoleModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRoles),
      });

      const result = await service.findAll();

      expect(result).toEqual(mockRoles);
      expect(mockRoleModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single role', async () => {
      mockRoleModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRole),
      });

      const result = await service.findOne(TEST_ROLE_NAME);

      expect(result).toEqual(mockRole);
      expect(mockRoleModel.findOne).toHaveBeenCalledWith({
        name: TEST_ROLE_NAME,
      });
    });

    it('should return null if role is not found', async () => {
      mockRoleModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findOne(NON_EXISTENT_ROLE);

      expect(result).toBeNull();
      expect(mockRoleModel.findOne).toHaveBeenCalledWith({
        name: NON_EXISTENT_ROLE,
      });
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const updatedRole = { ...mockRole, name: NEW_ROLE_NAME };
      mockRoleModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedRole),
      });

      const result = await service.update(TEST_ROLE_NAME, NEW_ROLE_NAME);

      expect(result).toEqual(updatedRole);
      expect(mockRoleModel.findOneAndUpdate).toHaveBeenCalledWith(
        { name: TEST_ROLE_NAME },
        { name: NEW_ROLE_NAME },
        { new: true },
      );
    });

    it('should throw NotFoundException if role is not found', async () => {
      mockRoleModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update(NON_EXISTENT_ROLE, NEW_ROLE_NAME),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a role', async () => {
      mockRoleModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRole),
      });

      const result = await service.remove(TEST_ROLE_NAME);

      expect(result).toEqual(mockRole);
      expect(mockRoleModel.findOneAndDelete).toHaveBeenCalledWith({
        name: TEST_ROLE_NAME,
      });
    });

    it('should throw NotFoundException if role is not found', async () => {
      mockRoleModel.findOneAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(NON_EXISTENT_ROLE)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
