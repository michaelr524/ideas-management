import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Idea, IdeaDocument } from './schemas/idea.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class IdeasService {
  constructor(
    @InjectModel(Idea.name) private readonly ideaModel: Model<IdeaDocument>,
  ) {}

  async create(title: string, description: string, user: User): Promise<Idea> {
    return this.ideaModel.create({
      title,
      description,
      creator: user._id,
    });
  }

  async findAll(user: User): Promise<Idea[]> {
    return this.ideaModel.find({ creator: user._id }).exec();
  }

  async findOne(id: string, user: User): Promise<Idea> {
    const idea = await this.ideaModel
      .findOne({ _id: id, creator: user._id })
      .exec();
    if (!idea) {
      throw new NotFoundException('Idea not found');
    }
    return idea;
  }

  async update(
    id: string,
    updateIdeaDto: Partial<{ title: string; description: string }>,
    user: User,
  ): Promise<Idea> {
    const updateObject = { ...updateIdeaDto, updatedAt: new Date() };
    const updatedIdea = await this.ideaModel
      .findOneAndUpdate(
        { _id: id, creator: user._id },
        { $set: updateObject },
        { new: true },
      )
      .exec();
    if (!updatedIdea) {
      throw new NotFoundException('Idea not found');
    }
    return updatedIdea;
  }

  async remove(id: string, user: User): Promise<void> {
    const result = await this.ideaModel
      .deleteOne({ _id: id, creator: user._id })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Idea not found');
    }
  }
}
