import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ApiConfigService } from './api-config.service';

describe('ApiConfigService', () => {
  let service: ApiConfigService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ApiConfigService>(ApiConfigService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have ConfigService injected', () => {
    expect(configService).toBeDefined();
  });

  describe('nodeEnv', () => {
    it('should return the NODE_ENV value', () => {
      configService.get.mockReturnValue('test');
      expect(service.nodeEnv).toBe('test');
      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should return undefined when NODE_ENV is not set', () => {
      configService.get.mockReturnValue(undefined);
      expect(service.nodeEnv).toBeUndefined();
    });
  });

  describe('port', () => {
    it('should return the PORT value', () => {
      configService.get.mockReturnValue(3000);
      const port = service.port;
      expect(port).toBe(3000);
      expect(typeof port).toBe('number');
      expect(configService.get).toHaveBeenCalledWith('PORT');
    });

    it('should throw an error when PORT is not a number', () => {
      configService.get.mockReturnValue('not a number');
      expect(() => service.port).toThrow('PORT must be a number');
    });
  });

  describe('mongoUri', () => {
    it('should return the MONGO_URI value', () => {
      configService.get.mockReturnValue('mongodb://localhost:27017/test');
      expect(service.mongoUri).toBe('mongodb://localhost:27017/test');
      expect(configService.get).toHaveBeenCalledWith('MONGO_URI');
    });

    it('should throw an error when MONGO_URI is not set', () => {
      configService.get.mockReturnValue(undefined);
      expect(() => service.mongoUri).toThrow('MONGO_URI must be defined');
    });
  });

  describe('isDevelopment', () => {
    it('should return true when NODE_ENV is development', () => {
      configService.get.mockReturnValue('development');
      expect(service.isDevelopment).toBe(true);
    });

    it('should return false when NODE_ENV is not development', () => {
      configService.get.mockReturnValue('production');
      expect(service.isDevelopment).toBe(false);
    });
  });

  describe('isProduction', () => {
    it('should return true when NODE_ENV is production', () => {
      configService.get.mockReturnValue('production');
      expect(service.isProduction).toBe(true);
    });

    it('should return false when NODE_ENV is not production', () => {
      configService.get.mockReturnValue('development');
      expect(service.isProduction).toBe(false);
    });
  });

  describe('isTest', () => {
    it('should return true when NODE_ENV is test', () => {
      configService.get.mockReturnValue('test');
      expect(service.isTest).toBe(true);
    });

    it('should return false when NODE_ENV is not test', () => {
      configService.get.mockReturnValue('development');
      expect(service.isTest).toBe(false);
    });
  });

  describe('jwtSecret', () => {
    it('should return the JWT_SECRET value', () => {
      configService.get.mockReturnValue('secret');
      expect(service.jwtSecret).toBe('secret');
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should throw an error when JWT_SECRET is not set', () => {
      configService.get.mockReturnValue(undefined);
      expect(() => service.jwtSecret).toThrow('JWT_SECRET must be defined');
    });
  });

  describe('jwtExpires', () => {
    it('should return the JWT_EXPIRES value as a number', () => {
      configService.get.mockReturnValue(3600);
      expect(service.jwtExpires).toBe(3600);
      expect(typeof service.jwtExpires).toBe('number');
      expect(configService.get).toHaveBeenCalledWith('JWT_EXPIRES');
    });

    it('should throw an error when JWT_EXPIRES is not a number', () => {
      configService.get.mockReturnValue('1h');
      expect(() => service.jwtExpires).toThrow('JWT_EXPIRES must be a number');
    });

    it('should throw an error when JWT_EXPIRES is not set', () => {
      configService.get.mockReturnValue(undefined);
      expect(() => service.jwtExpires).toThrow('JWT_EXPIRES must be a number');
    });
  });
});
