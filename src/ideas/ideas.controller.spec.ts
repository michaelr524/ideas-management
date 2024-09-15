import { Test, TestingModule } from '@nestjs/testing';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { CreateIdeaDto, UpdateIdeaDto } from './dto/idea.dto';
import { NotFoundException } from '@nestjs/common';

const TEST_USER = { _id: 'user123' };
const TEST_IDEA_ID = 'idea123';
const TEST_TITLE = 'Test Idea';
const TEST_DESCRIPTION = 'This is a test idea';
const TEST_CREATED_AT = new Date('2023-01-01');
const TEST_UPDATED_AT = new Date('2023-01-02');

const TEST_IDEA = {
  _id: TEST_IDEA_ID,
  title: TEST_TITLE,
  description: TEST_DESCRIPTION,
  creator: TEST_USER,
  createdAt: TEST_CREATED_AT,
  updatedAt: TEST_UPDATED_AT,
};

const TEST_IDEA_DTO = {
  _id: TEST_IDEA_ID,
  title: TEST_TITLE,
  description: TEST_DESCRIPTION,
  creator: TEST_USER._id,
  createdAt: TEST_CREATED_AT,
  updatedAt: TEST_UPDATED_AT,
};

describe('IdeasController', () => {
  let controller: IdeasController;
  let service: IdeasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IdeasController],
      providers: [
        {
          provide: IdeasService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<IdeasController>(IdeasController);
    service = module.get<IdeasService>(IdeasService);
  });

  describe('create', () => {
    it('should create a new idea', async () => {
      const createIdeaDto: CreateIdeaDto = {
        title: TEST_TITLE,
        description: TEST_DESCRIPTION,
      };
      (service.create as jest.Mock).mockResolvedValue(TEST_IDEA);

      const result = await controller.create(
        { user: TEST_USER },
        createIdeaDto,
      );

      expect(result).toEqual({
        message: 'Idea created successfully',
        idea: TEST_IDEA_DTO,
      });
      expect(service.create).toHaveBeenCalledWith(
        TEST_TITLE,
        TEST_DESCRIPTION,
        TEST_USER,
      );
    });
  });

  describe('findAll', () => {
    it('should return all ideas for the user', async () => {
      (service.findAll as jest.Mock).mockResolvedValue([TEST_IDEA]);

      const result = await controller.findAll({ user: TEST_USER });

      expect(result).toEqual({
        message: 'Ideas retrieved successfully',
        ideas: [TEST_IDEA_DTO],
      });
      expect(service.findAll).toHaveBeenCalledWith(TEST_USER);
    });

    it('should return an empty array when user has no ideas', async () => {
      (service.findAll as jest.Mock).mockResolvedValue([]);

      const result = await controller.findAll({ user: TEST_USER });

      expect(result).toEqual({
        message: 'Ideas retrieved successfully',
        ideas: [],
      });
    });
  });

  describe('findOne', () => {
    it('should return a specific idea', async () => {
      (service.findOne as jest.Mock).mockResolvedValue(TEST_IDEA);

      const result = await controller.findOne(
        { user: TEST_USER },
        TEST_IDEA_ID,
      );

      expect(result).toEqual({
        message: 'Idea retrieved successfully',
        idea: TEST_IDEA_DTO,
      });
      expect(service.findOne).toHaveBeenCalledWith(TEST_IDEA_ID, TEST_USER);
    });

    it('should throw NotFoundException when idea is not found', async () => {
      (service.findOne as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(
        controller.findOne({ user: TEST_USER }, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an idea', async () => {
      const updateIdeaDto: UpdateIdeaDto = { title: 'Updated Title' };
      const updatedIdea = { ...TEST_IDEA, title: 'Updated Title' };
      (service.update as jest.Mock).mockResolvedValue(updatedIdea);

      const result = await controller.update(
        { user: TEST_USER },
        TEST_IDEA_ID,
        updateIdeaDto,
      );

      expect(result).toEqual({
        message: 'Idea updated successfully',
        idea: { ...TEST_IDEA_DTO, title: 'Updated Title' },
      });
      expect(service.update).toHaveBeenCalledWith(
        TEST_IDEA_ID,
        updateIdeaDto,
        TEST_USER,
      );
    });

    it('should throw NotFoundException when updating non-existent idea', async () => {
      (service.update as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(
        controller.update({ user: TEST_USER }, 'nonexistent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an idea', async () => {
      (service.remove as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.remove({ user: TEST_USER }, TEST_IDEA_ID);

      expect(result).toEqual({ message: 'Idea deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(TEST_IDEA_ID, TEST_USER);
    });

    it('should throw NotFoundException when removing non-existent idea', async () => {
      (service.remove as jest.Mock).mockRejectedValue(new NotFoundException());

      await expect(
        controller.remove({ user: TEST_USER }, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
