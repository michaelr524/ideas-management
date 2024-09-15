import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from './configuration';

@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService<EnvConfig>) {}

  get nodeEnv(): string | undefined {
    return this.configService.get('NODE_ENV');
  }

  get port(): number {
    const port = this.configService.get('PORT');
    if (typeof port !== 'number') {
      throw new Error('PORT must be a number');
    }
    return port;
  }

  get mongoUri(): string {
    const uri = this.configService.get('MONGO_URI');
    if (!uri) {
      throw new Error('MONGO_URI must be defined');
    }
    return uri;
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get jwtSecret(): string {
    const secret = this.configService.get('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET must be defined');
    }
    return secret;
  }

  get jwtExpires(): number {
    const expires = this.configService.get('JWT_EXPIRES');
    if (typeof expires !== 'number') {
      throw new Error('JWT_EXPIRES must be a number');
    }
    return expires;
  }
}
