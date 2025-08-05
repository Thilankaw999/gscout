/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: SearchInvoicesUseCase Tests using Drizzle Repository
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SearchInvoicesUseCase } from './search-invoices.usecase';
import { InvoiceRepository } from '@app/db';
import { Logger } from '@app/logger';
import { SearchInvoicesInputDto } from '../../dto/search-invoices.dto';

describe('SearchInvoicesUseCase', () => {
  let useCase: SearchInvoicesUseCase;
  let invoiceRepository: jest.Mocked<InvoiceRepository>;
  let logger: jest.Mocked<Logger>;

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

  const mockPaginatedResult = {
    data: [mockInvoice],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchInvoicesUseCase,
        {
          provide: InvoiceRepository,
          useValue: {
            paginate: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            info: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<SearchInvoicesUseCase>(SearchInvoicesUseCase);
    invoiceRepository = module.get(InvoiceRepository);
    logger = module.get(Logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully search invoices with basic filters', async () => {
      // Arrange
      const input: SearchInvoicesInputDto = {
        invoiceNumber: 'INV-001',
        page: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };

      invoiceRepository.paginate.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(invoiceRepository.paginate).toHaveBeenCalledWith(
        {
          page: 1,
          limit: 10,
          orderBy: 'createdAt',
          orderDirection: 'desc',
        },
        expect.any(Object), // whereConditions
      );

      expect(result).toEqual({
        items: [
          {
            invoiceKey: 'test-key-123',
            invoiceNumber: 'INV-001',
            state: 'PENDING',
            invoiceTotal: '1000.00',
            fundedTotal: '800.00',
            paidTotal: '600.00',
            memberId: 100,
            providerId: 300,
            invoiceDate: '2024-01-01',
            receivedDate: '2024-01-02T00:00:00.000Z',
            source: 'system',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10,
      });
    });

    it('should handle multiple filters correctly', async () => {
      // Arrange
      const input: SearchInvoicesInputDto = {
        invoiceNumber: 'INV-001',
        memberId: 100,
        providerId: 300,
        invoiceStates: ['PENDING', 'PAID'],
        amountFrom: '500.00',
        amountTo: '1500.00',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        source: 'system',
        page: 2,
        pageSize: 20,
      };

      invoiceRepository.paginate.mockResolvedValue(mockPaginatedResult);

      // Act
      await useCase.execute(input);

      // Assert
      expect(invoiceRepository.paginate).toHaveBeenCalledWith(
        {
          page: 2,
          limit: 20,
          orderBy: 'createdAt',
          orderDirection: 'desc',
        },
        expect.any(Object), // whereConditions with multiple filters
      );
    });

    it('should use default values when optional parameters are not provided', async () => {
      // Arrange
      const input: SearchInvoicesInputDto = {};

      invoiceRepository.paginate.mockResolvedValue(mockPaginatedResult);

      // Act
      await useCase.execute(input);

      // Assert
      expect(invoiceRepository.paginate).toHaveBeenCalledWith(
        {
          page: 1,
          limit: 10,
          orderBy: 'createdAt',
          orderDirection: 'desc',
        },
        expect.any(Object),
      );
    });

    it('should handle null/undefined values in invoice data gracefully', async () => {
      // Arrange
      const invoiceWithNulls = {
        ...mockInvoice,
        invoiceKey: null,
        state: null,
        invoiceDate: null,
        receivedDate: null,
      };

      const paginatedResultWithNulls = {
        ...mockPaginatedResult,
        data: [invoiceWithNulls],
      };

      const input: SearchInvoicesInputDto = {
        page: 1,
        pageSize: 10,
      };

      invoiceRepository.paginate.mockResolvedValue(paginatedResultWithNulls);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.items[0]).toEqual({
        invoiceKey: '',
        invoiceNumber: 'INV-001',
        state: '',
        invoiceTotal: '1000.00',
        fundedTotal: '800.00',
        paidTotal: '600.00',
        memberId: 100,
        providerId: 300,
        invoiceDate: null,
        receivedDate: null,
        source: 'system',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const input: SearchInvoicesInputDto = {
        page: 1,
        pageSize: 10,
      };

      invoiceRepository.paginate.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Failed to search invoices',
      );
      expect(logger.error).toHaveBeenCalled();
    });

    it('should map sortBy values correctly', async () => {
      // Arrange
      const testCases = [
        { sortBy: 'invoiceNumber', expected: 'invoiceNumber' },
        { sortBy: 'state', expected: 'state' },
        { sortBy: 'invoiceTotal', expected: 'invoiceTotal' },
        { sortBy: 'fundedTotal', expected: 'fundedTotal' },
        { sortBy: 'paidTotal', expected: 'paidTotal' },
        { sortBy: 'invoiceDate', expected: 'invoiceDate' },
        { sortBy: 'receivedDate', expected: 'receivedDate' },
        { sortBy: 'createdAt', expected: 'createdAt' },
        { sortBy: 'updatedAt', expected: 'updatedAt' },
        { sortBy: 'invalid', expected: 'createdAt' }, // default
      ];

      for (const testCase of testCases) {
        const input: SearchInvoicesInputDto = {
          sortBy: testCase.sortBy as any,
          page: 1,
          pageSize: 10,
        };

        invoiceRepository.paginate.mockResolvedValue(mockPaginatedResult);

        // Act
        await useCase.execute(input);

        // Assert
        expect(invoiceRepository.paginate).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: testCase.expected,
          }),
          expect.any(Object),
        );
      }
    });
  });
});
