/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: GetInvoiceUseCase Tests using Drizzle Repository
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetInvoiceUseCase } from './get-invoice.usecase';
import { InvoiceRepository } from '@app/db';
import { Logger } from '@app/logger';
import { UserContextService } from '@app/user-context';

describe('GetInvoiceUseCase', () => {
  let useCase: GetInvoiceUseCase;
  let invoiceRepository: jest.Mocked<InvoiceRepository>;
  let logger: jest.Mocked<Logger>;
  let userContextService: jest.Mocked<UserContextService>;

  const mockInvoice = {
    id: 1,
    invoiceNumber: 'INV-001',
    invoiceKey: 'test-key-123',
    memberId: 100,
    providerAccountId: 200,
    providerId: 300,
    state: 'PENDING',
    invoiceTotal: '1000.00',
    fundedTotal: '800.00',
    paidTotal: '600.00',
    invoiceDate: new Date('2024-01-01'),
    receivedDate: new Date('2024-01-02'),
    source: 'system',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'system',
    updatedBy: 'system',
    deletedAt: null,
    deletedBy: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetInvoiceUseCase,
        {
          provide: InvoiceRepository,
          useValue: {
            findByInvoiceKey: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            info: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: UserContextService,
          useValue: {
            getCognitoKey: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetInvoiceUseCase>(GetInvoiceUseCase);
    invoiceRepository = module.get(InvoiceRepository);
    logger = module.get(Logger);
    userContextService = module.get(UserContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully retrieve invoice by invoice key', async () => {
      // Arrange
      const invoiceKey = 'test-key-123';
      userContextService.getCognitoKey.mockReturnValue('test-cognito-key');
      invoiceRepository.findByInvoiceKey.mockResolvedValue(mockInvoice);

      // Act
      const result = await useCase.execute(invoiceKey);

      // Assert
      expect(invoiceRepository.findByInvoiceKey).toHaveBeenCalledWith(
        invoiceKey,
      );
      expect(result).toEqual({
        invoiceKey: 'test-key-123',
        invoiceNumber: 'INV-001',
        state: {
          displayName: 'Pending',
          value: 'PENDING',
          colorCode: 'warning',
        },
        provider: {
          bsb: '',
          providerName: '',
          abn: '',
          accountNumber: '',
          providerKey: '300',
        },
        invoicedTotal: '1000.00',
        claimedTotal: null,
        fundedTotal: '800.00',
        paidTotal: '600.00',
        member: {
          memberKey: '100',
          firstName: '',
          lastName: '',
          source: 'system',
          isPlanManagedByLeapin: true,
        },
        attachment: {
          url: '',
          name: '',
          contentType: '',
        },
        claims: [],
        invoiceDate: '2024-01-01',
        receivedDate: '2024-01-02T00:00:00.000Z',
        dueDate: null,
        isPending: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should throw NotFoundException when invoice is not found', async () => {
      // Arrange
      const invoiceKey = 'non-existent-key';
      userContextService.getCognitoKey.mockReturnValue('test-cognito-key');
      invoiceRepository.findByInvoiceKey.mockResolvedValue(undefined);

      // Act & Assert
      await expect(useCase.execute(invoiceKey)).rejects.toThrow(
        NotFoundException,
      );
      expect(invoiceRepository.findByInvoiceKey).toHaveBeenCalledWith(
        invoiceKey,
      );
    });

    it('should handle null/undefined values gracefully', async () => {
      // Arrange
      const invoiceWithNulls = {
        ...mockInvoice,
        invoiceKey: null,
        state: null,
        invoiceDate: null,
        receivedDate: null,
        memberId: null,
        providerId: null,
      };

      const invoiceKey = 'test-key-123';
      userContextService.getCognitoKey.mockReturnValue('test-cognito-key');
      invoiceRepository.findByInvoiceKey.mockResolvedValue(invoiceWithNulls);

      // Act
      const result = await useCase.execute(invoiceKey);

      // Assert
      expect(result.invoiceKey).toBe('');
      expect(result.state.value).toBe('');
      expect(result.state.displayName).toBe('Unknown');
      expect(result.state.colorCode).toBe('secondary');
      expect(result.invoiceDate).toBe('');
      expect(result.receivedDate).toBe('');
      expect(result.provider.providerKey).toBe('');
      expect(result.member.memberKey).toBe('');
    });

    it('should correctly identify pending states', async () => {
      // Arrange
      const pendingStates = ['PENDING', 'PENDING_REVIEW', 'PENDING_CLAIM'];
      const nonPendingStates = ['PAID', 'CANCELLED', 'REJECTED'];

      for (const state of pendingStates) {
        const invoiceWithState = { ...mockInvoice, state };
        userContextService.getCognitoKey.mockReturnValue('test-cognito-key');
        invoiceRepository.findByInvoiceKey.mockResolvedValue(invoiceWithState);

        // Act
        const result = await useCase.execute('test-key');

        // Assert
        expect(result.isPending).toBe(true);
      }

      for (const state of nonPendingStates) {
        const invoiceWithState = { ...mockInvoice, state };
        userContextService.getCognitoKey.mockReturnValue('test-cognito-key');
        invoiceRepository.findByInvoiceKey.mockResolvedValue(invoiceWithState);

        // Act
        const result = await useCase.execute('test-key');

        // Assert
        expect(result.isPending).toBe(false);
      }
    });

    it('should map state display names correctly', async () => {
      // Arrange
      const testCases = [
        { state: 'DRAFT', expected: 'Draft' },
        { state: 'PENDING', expected: 'Pending' },
        { state: 'PAID', expected: 'Paid' },
        { state: 'CANCELLED', expected: 'Cancelled' },
        { state: 'UNKNOWN_STATE', expected: 'UNKNOWN_STATE' },
        { state: null, expected: 'Unknown' },
      ];

      for (const testCase of testCases) {
        const invoiceWithState = { ...mockInvoice, state: testCase.state };
        userContextService.getCognitoKey.mockReturnValue('test-cognito-key');
        invoiceRepository.findByInvoiceKey.mockResolvedValue(invoiceWithState);

        // Act
        const result = await useCase.execute('test-key');

        // Assert
        expect(result.state.displayName).toBe(testCase.expected);
      }
    });

    it('should map state color codes correctly', async () => {
      // Arrange
      const testCases = [
        { state: 'DRAFT', expected: 'secondary' },
        { state: 'PENDING', expected: 'warning' },
        { state: 'PAID', expected: 'success' },
        { state: 'CANCELLED', expected: 'danger' },
        { state: 'UNKNOWN_STATE', expected: 'secondary' },
        { state: null, expected: 'secondary' },
      ];

      for (const testCase of testCases) {
        const invoiceWithState = { ...mockInvoice, state: testCase.state };
        userContextService.getCognitoKey.mockReturnValue('test-cognito-key');
        invoiceRepository.findByInvoiceKey.mockResolvedValue(invoiceWithState);

        // Act
        const result = await useCase.execute('test-key');

        // Assert
        expect(result.state.colorCode).toBe(testCase.expected);
      }
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const invoiceKey = 'test-key-123';
      userContextService.getCognitoKey.mockReturnValue('test-cognito-key');
      invoiceRepository.findByInvoiceKey.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(useCase.execute(invoiceKey)).rejects.toThrow(
        'Failed to retrieve invoice',
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
