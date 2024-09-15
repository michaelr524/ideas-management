import { Test, TestingModule } from '@nestjs/testing';
import { IdeasService } from './ideas.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Idea, IdeaDocument } from './schemas/idea.schema';
import { User } from '../users/schemas/user.schema';
import { NotFoundException } from '@nestjs/common';

const TEST_USER_ID = 'user1';
const TEST_IDEA_ID = 'idea1';
const TEST_IDEA_TITLE = 'Test Idea';
const TEST_IDEA_DESCRIPTION = 'Test Description';
const UPDATED_IDEA_TITLE = 'Updated Title';

const mockUser = { _id: TEST_USER_ID } as User;
const mockIdea = {
  _id: TEST_IDEA_ID,
  title: TEST_IDEA_TITLE,
  description: TEST_IDEA_DESCRIPTION,
  creator: TEST_USER_ID,
  save: jest.fn(),
};

describe('IdeasService', () => {
  let service: IdeasService;
  let model: Model<IdeaDocument>;

  const mockIdeaModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    deleteOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdeasService,
        {
          provide: getModelToken(Idea.name),
          useValue: mockIdeaModel,
        },
      ],
    }).compile();

    service = module.get<IdeasService>(IdeasService);
    model = module.get<Model<IdeaDocument>>(getModelToken(Idea.name));
  });

  describe('create', () => {
    it('should create a new idea', async () => {
      jest.spyOn(model, 'create').mockResolvedValueOnce(mockIdea as any);

      const result = await service.create(
        TEST_IDEA_TITLE,
        TEST_IDEA_DESCRIPTION,
        mockUser,
      );
      expect(result).toEqual(mockIdea);
      expect(model.create).toHaveBeenCalledWith({
        title: TEST_IDEA_TITLE,
        description: TEST_IDEA_DESCRIPTION,
        creator: TEST_USER_ID,
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of ideas', async () => {
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce([mockIdea]),
      } as any);

      const result = await service.findAll(mockUser);
      expect(result).toEqual([mockIdea]);
      expect(model.find).toHaveBeenCalledWith({ creator: TEST_USER_ID });
    });
  });

  describe('findOne', () => {
    it('should return a single idea', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockIdea),
      } as any);

      const result = await service.findOne(TEST_IDEA_ID, mockUser);
      expect(result).toEqual(mockIdea);
      expect(model.findOne).toHaveBeenCalledWith({
        _id: TEST_IDEA_ID,
        creator: TEST_USER_ID,
      });
    });

    it('should throw NotFoundException if idea is not found', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as any);

      await expect(service.findOne(TEST_IDEA_ID, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an idea', async () => {
      const updatedIdea = { ...mockIdea, title: UPDATED_IDEA_TITLE };
      jest.spyOn(model, 'findOneAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(updatedIdea),
      } as any);

      const result = await service.update(
        TEST_IDEA_ID,
        { title: UPDATED_IDEA_TITLE },
        mockUser,
      );
      expect(result).toEqual(updatedIdea);
      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: TEST_IDEA_ID, creator: TEST_USER_ID },
        { $set: { title: UPDATED_IDEA_TITLE, updatedAt: expect.any(Date) } },
        { new: true },
      );
    });

    it('should throw NotFoundException if idea is not found', async () => {
      jest.spyOn(model, 'findOneAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as any);

      await expect(
        service.update(TEST_IDEA_ID, { title: UPDATED_IDEA_TITLE }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an idea', async () => {
      jest.spyOn(model, 'deleteOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce({ deletedCount: 1 }),
      } as any);

      await service.remove(TEST_IDEA_ID, mockUser);
      expect(model.deleteOne).toHaveBeenCalledWith({
        _id: TEST_IDEA_ID,
        creator: TEST_USER_ID,
      });
    });

    it('should throw NotFoundException if idea is not found', async () => {
      jest.spyOn(model, 'deleteOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce({ deletedCount: 0 }),
      } as any);

      await expect(service.remove(TEST_IDEA_ID, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
