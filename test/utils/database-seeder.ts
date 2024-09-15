import { INestApplication } from '@nestjs/common';
import { RolesService } from '../../src/roles/roles.service';
import { UsersService } from '../../src/users/users.service';

export class DatabaseSeeder {
  constructor(
    private readonly app: INestApplication,
    private readonly rolesService: RolesService,
    private readonly usersService: UsersService,
  ) {}

  async seedRoles(): Promise<void> {
    const roles = ['admin', 'user', 'editor'];
    for (const roleName of roles) {
      try {
        await this.rolesService.create(roleName);
        // console.log(`Role '${roleName}' created successfully.`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          // console.log(`Role '${roleName}' already exists. Skipping creation.`);
        } else {
          console.error(`Failed to create role '${roleName}':`, error.message);
        }
      }
    }
  }

  async seedUsers(): Promise<void> {
    const users = [
      {
        email: 'admin@example.com',
        password: 'adminpass',
        name: 'Admin User',
        role: 'admin',
      },
      {
        email: 'user@example.com',
        password: 'userpass',
        name: 'Regular User',
        role: 'user',
      },
      {
        email: 'editor@example.com',
        password: 'editorpass',
        name: 'Editor User',
        role: 'editor',
      },
      {
        email: 'norole@example.com',
        password: 'norolepass',
        name: 'No Role User',
      },
    ];

    for (const user of users) {
      try {
        await this.usersService.create(
          user.email,
          user.password,
          user.name,
          user.role,
        );
        console.log(`User '${user.email}' created successfully.`);
      } catch (error) {
        console.error(`Failed to create user '${user.email}':`, error.message);
      }
    }
  }
}
