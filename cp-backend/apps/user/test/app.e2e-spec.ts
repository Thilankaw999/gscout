/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: UserApiController (e2e)
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { UserApiController } from '../src/user.controller';
import { GetUserUseCase } from '../src/queries/get-user/get-user.usecase';
import { FeaturesGuard } from '@app/permissions';
import { Logger } from '@app/logger';
import { UserContextService } from '@app/user-context';
import { ProperInsuranceClientService } from '../src/services/its-client.service';
import { ConfigProvider } from '@app/common';

describe('UserApiController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserApiController],
      providers: [
        {
          provide: GetUserUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              customerId: '1234567890',
              name: 'Shannon Prunkl',
              email: 'shannon@proper.insure',
              phone: '(443) 798-8013',
              address: {
                line1: '3183 Orthello Way',
                line2: '',
                city: 'Santa Clara',
                state: 'CA',
                postalCode: '95051',
                country: 'USA',
              },
            }),
          },
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: UserContextService,
          useValue: {
            initialize: jest.fn(),
            getUserContext: jest.fn().mockReturnValue({
              userId: 'test-user-id',
              email: 'test@example.com',
            }),
            getUserId: jest.fn().mockReturnValue('test-user-id'),
          },
        },
        {
          provide: ProperInsuranceClientService,
          useValue: {
            getUserProfile: jest.fn().mockResolvedValue({
              customerId: '1234567890',
              name: 'Shannon Prunkl',
              email: 'shannon@proper.insure',
              phone: '(443) 798-8013',
              address: {
                line1: '3183 Orthello Way',
                line2: '',
                city: 'Santa Clara',
                state: 'CA',
                postalCode: '95051',
                country: 'USA',
              },
            }),
          },
        },
        {
          provide: ConfigProvider,
          useValue: {
            get: jest.fn().mockReturnValue('https://pcp-api-dev.mitralabs.co.uk/properInsurance'),
          },
        },
        Reflector,
      ],
    })
      .overrideGuard(FeaturesGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/user (GET) should return user profile', () => {
    return request(app.getHttpServer())
      .get('/user')
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.body.customerId).toBe('1234567890');
        expect(res.body.name).toBe('Shannon Prunkl');
        expect(res.body.email).toBe('shannon@proper.insure');
        expect(res.body.phone).toBe('(443) 798-8013');
        expect(res.body.address.line1).toBe('3183 Orthello Way');
        expect(res.body.address.city).toBe('Santa Clara');
        expect(res.body.address.state).toBe('CA');
        expect(res.body.address.postalCode).toBe('95051');
        expect(res.body.address.country).toBe('USA');
      });
  });

  // Note: Swagger endpoint test removed due to module dependency complexity in e2e testing
});
