import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { BlacklistedToken } from '../src/auth/schemas/blacklisted-token.schema';
import { User } from '../src/users/schemas/user.schema';
import { DatabaseSeeder } from './utils/database-seeder';
import { RolesService } from '../src/roles/roles.service';
import { UsersService } from '../src/users/users.service';

const TEST_USER = {
  username: 'testauth@example.com',
  password: 'password123',
  role: 'user',
};

const INVALID_CREDENTIALS = {
  username: 'test@example.com',
  password: 'wrongpassword',
};

const AUTH_ENDPOINTS = {
  signup: '/auth/signup',
  login: '/auth/login',
  profile: '/auth/profile',
  logout: '/auth/logout',
};

const MESSAGES = {
  userCreated: 'User successfully created',
  logoutSuccessful: 'Logout successful',
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let blacklistedTokenModel: Model<BlacklistedToken>;
  let userModel: Model<User>;
  let databaseSeeder: DatabaseSeeder;
  let createdUserIds: string[] = [];
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    blacklistedTokenModel = moduleFixture.get<Model<BlacklistedToken>>(
      getModelToken(BlacklistedToken.name),
    );
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));

    const rolesService = app.get<RolesService>(RolesService);
    usersService = app.get<UsersService>(UsersService);
    databaseSeeder = new DatabaseSeeder(app, rolesService, usersService);
    // Seed roles before running tests
    await databaseSeeder.seedRoles();
  });

  afterAll(async () => {
    await blacklistedTokenModel.deleteMany({});

    const user = await usersService.findByUsername(TEST_USER.username);
    if (user) {
      await userModel.findByIdAndDelete(user._id);
    }

    await app.close();
  });

  beforeEach(async () => {
    const user = await usersService.findByUsername(TEST_USER.username);
    if (user) {
      await userModel.findByIdAndDelete(user._id);
    }

    await blacklistedTokenModel.deleteMany({});
    createdUserIds = []; // Reset the array of created user IDs
  });

  describe('/auth/signup (POST)', () => {
    it('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post(AUTH_ENDPOINTS.signup)
        .send(TEST_USER)
        .expect(201);

      expect(response.body.message).toBe(MESSAGES.userCreated);
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user.email).toBe(TEST_USER.username);
      expect(response.body.user.roles).toContain(TEST_USER.role);

      // Store the created user ID
      createdUserIds.push(response.body.user._id);
    });

    it('should return 409 if user already exists', async () => {
      await request(app.getHttpServer())
        .post(AUTH_ENDPOINTS.signup)
        .send(TEST_USER);

      await request(app.getHttpServer())
        .post(AUTH_ENDPOINTS.signup)
        .send(TEST_USER)
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post(AUTH_ENDPOINTS.signup)
        .send(TEST_USER);
    });

    it('should return a token for valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post(AUTH_ENDPOINTS.login)
        .send({
          username: TEST_USER.username,
          password: TEST_USER.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      await request(app.getHttpServer())
        .post(AUTH_ENDPOINTS.login)
        .send(INVALID_CREDENTIALS)
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    let token: string;

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post(AUTH_ENDPOINTS.signup)
        .send(TEST_USER);

      const response = await request(app.getHttpServer())
        .post(AUTH_ENDPOINTS.login)
        .send({
          username: TEST_USER.username,
          password: TEST_USER.password,
        });
      token = response.body.token;
    });

    it('should return user profile for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get(AUTH_ENDPOINTS.profile)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.email).toBe(TEST_USER.username);
      expect(response.body.roles).toContain(TEST_USER.role);
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get(AUTH_ENDPOINTS.profile)
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    let token: string;

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post(AUTH_ENDPOINTS.signup)
        .send(TEST_USER);

      const response = await request(app.getHttpServer())
        .post(AUTH_ENDPOINTS.login)
        .send({
          username: TEST_USER.username,
          password: TEST_USER.password,
        });
      token = response.body.token;
    });

    it('should successfully logout user', async () => {
      const response = await request(app.getHttpServer())
        .post(AUTH_ENDPOINTS.logout)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe(MESSAGES.logoutSuccessful);
    });

    it('should return 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .post(AUTH_ENDPOINTS.logout)
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);
    });

    it('should not allow access to protected routes after logout', async () => {
      await request(app.getHttpServer())
        .post(AUTH_ENDPOINTS.logout)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(AUTH_ENDPOINTS.profile)
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
});
