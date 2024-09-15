import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { ApiConfigModule } from '../api-config/api-config.module';
import { ApiConfigService } from '../api-config/api-config.service';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BlacklistedToken,
  BlacklistedTokenSchema,
} from './schemas/blacklisted-token.schema';
import { RolesModule } from '../roles/roles.module';
import { RolesService } from '../roles/roles.service';

@Module({
  imports: [
    UsersModule,
    ApiConfigModule,
    RolesModule,
    JwtModule.registerAsync({
      imports: [ApiConfigModule],
      useFactory: async (configService: ApiConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: { expiresIn: configService.jwtExpires },
      }),
      inject: [ApiConfigService],
    }),
    MongooseModule.forFeature([
      { name: BlacklistedToken.name, schema: BlacklistedTokenSchema },
    ]),
  ],
  providers: [
    AuthService,
    RolesService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
