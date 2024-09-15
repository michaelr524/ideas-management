import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/schemas/user.schema';
import { Idea } from '../src/ideas/schemas/idea.schema';
import { CreateIdeaDto, UpdateIdeaDto } from '../src/ideas/dto/idea.dto';

const TEST_USER = {
  username: 'testideas@example.com',
  password: 'password123',
  role: 'user',
};

const TEST_IDEA = {
  title: 'Test Idea',
  description: 'This is a test idea',
};

const UPDATED_IDEA = {
  title: 'Updated Test Idea',
};

const AUTH_ENDPOINTS = {
  signup: '/auth/signup',
  login: '/auth/login',
};

const IDEAS_ENDPOINT = '/ideas';

const MESSAGES = {
  ideaCreated: 'Idea created successfully',
  ideasRetrieved: 'Ideas retrieved successfully',
  ideaRetrieved: 'Idea retrieved successfully',
  ideaUpdated: 'Idea updated successfully',
  ideaDeleted: 'Idea deleted successfully',
};

describe('IdeasController (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;
  let ideaModel: Model<Idea>;
  let jwtToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    ideaModel = moduleFixture.get<Model<Idea>>(getModelToken(Idea.name));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Delete any existing test users and their ideas
    await ideaModel.deleteMany({});
    await userModel.findByIdAndDelete(testUserId);

    // Create a test user and get JWT token
    const signupResponse = await request(app.getHttpServer())
      .post(AUTH_ENDPOINTS.signup)
      .send(TEST_USER)
      .expect(201);

    testUserId = signupResponse.body.user._id;

    const loginResponse = await request(app.getHttpServer())
      .post(AUTH_ENDPOINTS.login)
      .send({
        username: TEST_USER.username,
        password: TEST_USER.password,
      })
      .expect(200);

    jwtToken = loginResponse.body.token;
  });

  afterEach(async () => {
    // Delete the test user and their ideas
    await ideaModel.deleteMany({});
    await userModel.findByIdAndDelete(testUserId);
  });

  it('/ideas (POST) - should create a new idea', async () => {
    const createIdeaDto: CreateIdeaDto = TEST_IDEA;

    const response = await request(app.getHttpServer())
      .post(IDEAS_ENDPOINT)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(createIdeaDto)
      .expect(201);

    expect(response.body.message).toBe(MESSAGES.ideaCreated);
    expect(response.body.idea).toHaveProperty('_id');
    expect(response.body.idea.title).toBe(createIdeaDto.title);
    expect(response.body.idea.description).toBe(createIdeaDto.description);
  });

  it('/ideas (GET) - should get all ideas for the user', async () => {
    // Create an idea first
    await request(app.getHttpServer())
      .post(IDEAS_ENDPOINT)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(TEST_IDEA)
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(IDEAS_ENDPOINT)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(response.body.message).toBe(MESSAGES.ideasRetrieved);
    expect(Array.isArray(response.body.ideas)).toBe(true);
    expect(response.body.ideas.length).toBeGreaterThan(0);
  });

  it('/ideas/:id (GET) - should get a specific idea', async () => {
    // Create an idea first
    const createResponse = await request(app.getHttpServer())
      .post(IDEAS_ENDPOINT)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(TEST_IDEA)
      .expect(201);

    const ideaId = createResponse.body.idea._id;

    const response = await request(app.getHttpServer())
      .get(`${IDEAS_ENDPOINT}/${ideaId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(response.body.message).toBe(MESSAGES.ideaRetrieved);
    expect(response.body.idea._id).toBe(ideaId);
  });

  it('/ideas/:id (PUT) - should update an idea', async () => {
    // Create an idea first
    const createResponse = await request(app.getHttpServer())
      .post(IDEAS_ENDPOINT)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(TEST_IDEA)
      .expect(201);

    const ideaId = createResponse.body.idea._id;

    const updateIdeaDto: UpdateIdeaDto = UPDATED_IDEA;

    const response = await request(app.getHttpServer())
      .put(`${IDEAS_ENDPOINT}/${ideaId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(updateIdeaDto)
      .expect(200);

    expect(response.body.message).toBe(MESSAGES.ideaUpdated);
    expect(response.body.idea.title).toBe(updateIdeaDto.title);
  });

  it('/ideas/:id (DELETE) - should delete an idea', async () => {
    // Create an idea first
    const createResponse = await request(app.getHttpServer())
      .post(IDEAS_ENDPOINT)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(TEST_IDEA)
      .expect(201);

    const ideaId = createResponse.body.idea._id;

    const response = await request(app.getHttpServer())
      .delete(`${IDEAS_ENDPOINT}/${ideaId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(response.body.message).toBe(MESSAGES.ideaDeleted);
  });

  it('/ideas/:id (GET) - should return 404 for deleted idea', async () => {
    // Create an idea first
    const createResponse = await request(app.getHttpServer())
      .post(IDEAS_ENDPOINT)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send(TEST_IDEA)
      .expect(201);

    const ideaId = createResponse.body.idea._id;

    // Delete the idea
    await request(app.getHttpServer())
      .delete(`${IDEAS_ENDPOINT}/${ideaId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    // Try to get the deleted idea
    await request(app.getHttpServer())
      .get(`${IDEAS_ENDPOINT}/${ideaId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(404);
  });
});
