import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiConfigModule } from './api-config/api-config.module';
import { ApiConfigService } from './api-config/api-config.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { IdeasModule } from './ideas/ideas.module';
import { RoleSeeder } from './database/seed-roles';

@Module({
  imports: [
    ApiConfigModule,
    MongooseModule.forRootAsync({
      useFactory: async (configService: ApiConfigService) => ({
        uri: configService.mongoUri,
      }),
      inject: [ApiConfigService],
      imports: [ApiConfigModule],
    }),
    RolesModule,
    AuthModule,
    UsersModule,
    IdeasModule,
  ],
  controllers: [],
  providers: [RoleSeeder],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly roleSeeder: RoleSeeder) {}

  async onModuleInit() {
    await this.roleSeeder.seedRoles();
  }
}
