import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from './schemas/role.schema';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private roleModel: Model<Role>) {}

  async create(name: string): Promise<Role> {
    const existingRole = await this.roleModel.findOne({ name }).exec();

    if (existingRole) {
      throw new ConflictException(`Role with name "${name}" already exists`);
    }

    const createdRole = await this.roleModel.create({ name });
    return createdRole;
  }

  async findAll(): Promise<Role[]> {
    return this.roleModel.find().exec();
  }

  async findOne(name: string): Promise<Role | null> {
    return this.roleModel.findOne({ name }).exec();
  }

  async findManyById(ids: string[]): Promise<Role[]> {
    return this.roleModel.find({ _id: { $in: ids } }).exec();
  }

  async findById(id: string): Promise<Role | null> {
    return this.roleModel.findById(id).exec();
  }

  async update(name: string, newName: string): Promise<Role> {
    const updatedRole = await this.roleModel
      .findOneAndUpdate({ name }, { name: newName }, { new: true })
      .exec();

    if (!updatedRole) {
      throw new NotFoundException(`Role "${name}" not found`);
    }

    return updatedRole;
  }

  async remove(name: string): Promise<Role> {
    const deletedRole = await this.roleModel.findOneAndDelete({ name }).exec();

    if (!deletedRole) {
      throw new NotFoundException(`Role "${name}" not found`);
    }

    return deletedRole;
  }
}
