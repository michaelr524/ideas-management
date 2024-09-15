import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly rolesService: RolesService,
  ) {}

  async findOne(username: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email: username }).exec();
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ email: username }).exec();
  }

  async create(
    email: string,
    password: string,
    name: string,
    roleName?: string,
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const roles = [];

    if (roleName) {
      const role = await this.rolesService.findOne(roleName);
      if (!role) {
        throw new NotFoundException(`Role '${roleName}' does not exist`);
      }
      roles.push(role._id);
    } else {
      // If no role is specified, assign the default 'user' role
      const defaultRole = await this.rolesService.findOne('user');
      if (defaultRole) {
        roles.push(defaultRole._id);
      }
    }

    const createdUser = await this.userModel.create({
      email,
      password: hashedPassword,
      name,
      roles,
    });

    return createdUser;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findOne(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }
}
