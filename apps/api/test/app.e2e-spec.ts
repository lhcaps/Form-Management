import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        const body = res.body as Record<string, unknown>;
        if (typeof body.status !== 'string') {
          throw new Error('Expected body.status to be a string');
        }
        if (typeof body.name !== 'string') {
          throw new Error('Expected body.name to be a string');
        }
        if (typeof body.version !== 'string') {
          throw new Error('Expected body.version to be a string');
        }
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
