/**
 * Author: Assistant
 * Created on: 2025-08-07
 * Description: E2E tests for Chatbot API
 * Module: Girl Scouts Chatbot
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ChatbotModule } from '../src/chatbot.module';

describe('ChatbotController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ChatbotModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/chatbot/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/chatbot/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'healthy');
          expect(res.body).toHaveProperty('service', 'girl-scouts-chatbot');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('/chatbot/start-session (POST)', () => {
    it('should create a new session', () => {
      return request(app.getHttpServer())
        .post('/chatbot/start-session')
        .send({ userId: 'test-user' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('sessionId');
          expect(res.body).toHaveProperty('welcomeMessage');
          expect(res.body).toHaveProperty('currentQuestion', 1);
          expect(res.body).toHaveProperty('status', 'active');
        });
    });
  });

  describe('/chatbot/chat (POST)', () => {
    it('should process a chat message', async () => {
      // First create a session
      const sessionResponse = await request(app.getHttpServer())
        .post('/chatbot/start-session')
        .send({ userId: 'test-user' })
        .expect(201);

      const sessionId = sessionResponse.body.sessionId;

      // Then send a chat message
      return request(app.getHttpServer())
        .post('/chatbot/chat')
        .send({
          sessionId,
          message: 'John Doe',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('response');
          expect(res.body).toHaveProperty('sessionId', sessionId);
          expect(res.body).toHaveProperty('currentQuestion');
          expect(res.body).toHaveProperty('isCompleted');
          expect(res.body).toHaveProperty('status');
        });
    });

    it('should return 404 for invalid session', () => {
      return request(app.getHttpServer())
        .post('/chatbot/chat')
        .send({
          sessionId: 'invalid-session',
          message: 'Hello',
        })
        .expect(404);
    });
  });

  describe('/chatbot/session/:sessionId/status (GET)', () => {
    it('should return session status', async () => {
      // First create a session
      const sessionResponse = await request(app.getHttpServer())
        .post('/chatbot/start-session')
        .send({ userId: 'test-user' })
        .expect(201);

      const sessionId = sessionResponse.body.sessionId;

      // Then get session status
      return request(app.getHttpServer())
        .get(`/chatbot/session/${sessionId}/status`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('sessionId', sessionId);
          expect(res.body).toHaveProperty('currentQuestion', 1);
          expect(res.body).toHaveProperty('isCompleted', false);
          expect(res.body).toHaveProperty('status', 'active');
        });
    });

    it('should return 404 for invalid session', () => {
      return request(app.getHttpServer())
        .get('/chatbot/session/invalid-session/status')
        .expect(404);
    });
  });
});
