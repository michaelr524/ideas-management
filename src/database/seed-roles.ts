import { Injectable } from '@nestjs/common';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class RoleSeeder {
  constructor(private readonly rolesService: RolesService) {}

  async seedRoles(): Promise<void> {
    const roles = ['admin', 'user', 'editor'];
    for (const roleName of roles) {
      try {
        await this.rolesService.create(roleName);
        console.log(`Role '${roleName}' created successfully.`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          // console.log(`Role '${roleName}' already exists. Skipping creation.`);
        } else {
          console.error(`Failed to create role '${roleName}':`, error.message);
        }
      }
    }
  }
}
