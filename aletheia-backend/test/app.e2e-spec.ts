import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { configureOpenApi } from '../src/app/openapi.setup';

interface HttpResponse {
  status: number;
  text: string;
}

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureOpenApi(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', async () => {
    const res = (await request(app.getHttpServer())
      .get('/')
      .expect(200)) as unknown as HttpResponse;

    expect(res.text).toBe('Hello World!');
  });

  it('/health (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      graphqlPath: '/graphql',
      openApiPath: '/api',
    });
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('/api/json (GET) OpenAPI document', async () => {
    const res = await request(app.getHttpServer()).get('/api/json').expect(200);
    expect(res.body).toHaveProperty('openapi');
    expect(res.body).toHaveProperty('paths');
  });
});
