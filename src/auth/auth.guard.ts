import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiConfigService } from '../api-config/api-config.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_ENDPOINT } from './public.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlacklistedToken } from './schemas/blacklisted-token.schema';
import { extractTokenFromHeader } from './utils/extract-token.util';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ApiConfigService,
    private reflector: Reflector,
    @InjectModel(BlacklistedToken.name)
    private blacklistedTokenModel: Model<BlacklistedToken>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.isPublicEndpoint(context);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const isBlacklisted = await this.blacklistedTokenModel.exists({ token });

    if (isBlacklisted) {
      this.logger.warn(`Attempt to use blacklisted token`);
      throw new UnauthorizedException('Token has been revoked');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.jwtSecret,
      });
      request['user'] = payload;
    } catch (error) {
      this.logger.warn(`Failed to verify token: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
    return true;
  }

  private isPublicEndpoint(context: ExecutionContext) {
    return this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ENDPOINT, [
      context.getHandler(),
      context.getClass(),
    ]);
  }
}
