/**
 * policy.controller.ts
 * Author: Insurance Portal Development Team
 * Description: Controller to manage policy, claims, and documents operations
 * Module: Insurance Property Portal Backend
 */

import {
  applyDecorators,
  Controller,
  Get,
  Param,
  HttpStatus,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ACTIONS,
  CheckFeatures,
  FeaturesGuard,
  RESOURCES,
} from '@app/permissions';
import { createSwaggerResponse } from '@app/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { PolicyApiModule } from './policy.module';

// Use Cases
import { GetPoliciesUseCase } from './queries/get-policies/get-policies.usecase';
import { GetClaimsUseCase } from './queries/get-claims/get-claims.usecase';
import { GetDocumentsUseCase } from './queries/get-documents/get-documents.usecase';
import { DownloadDocumentUseCase } from './queries/download-document/download-document.usecase';

// DTOs
import { GetPoliciesQueryDto, PropertyResponseDto } from './dto/get-policies.dto';
import { GetClaimsQueryDto, ClaimResponseDto } from './dto/get-claims.dto';
import { GetDocumentsQueryDto, DocumentResponseDto, DownloadDocumentParamsDto } from './dto/get-documents.dto';

@Controller()
@ApiTags('Insurance Portal')
@UseGuards(FeaturesGuard)
export class PolicyApiController {
  constructor(
    private readonly getPoliciesUseCase: GetPoliciesUseCase,
    private readonly getClaimsUseCase: GetClaimsUseCase,
    private readonly getDocumentsUseCase: GetDocumentsUseCase,
    private readonly downloadDocumentUseCase: DownloadDocumentUseCase,
  ) {}

  // Policies Endpoints
  @Get('policies')
  @CheckFeatures([RESOURCES.POLICIES, ACTIONS.GET])
  @GetPoliciesAPIDocs()
  async getPolicies(
    @Query() query: GetPoliciesQueryDto,
  ): Promise<PropertyResponseDto[]> {
    return this.getPoliciesUseCase.execute(query);
  }

  // Claims Endpoints
  @Get('claims')
  @CheckFeatures([RESOURCES.CLAIMS, ACTIONS.GET])
  @GetClaimsAPIDocs()
  async getClaims(
    @Query() query: GetClaimsQueryDto,
  ): Promise<ClaimResponseDto[]> {
    return this.getClaimsUseCase.execute(query);
  }

  // Documents Endpoints
  @Get('documents')
  @CheckFeatures([RESOURCES.DOCUMENTS, ACTIONS.GET])
  @GetDocumentsAPIDocs()
  async getDocuments(
    @Query() query: GetDocumentsQueryDto,
  ): Promise<DocumentResponseDto[]> {
    return this.getDocumentsUseCase.execute(query);
  }

  @Get('documents/:documentId/download')
  @CheckFeatures([RESOURCES.DOCUMENTS, ACTIONS.GET])
  @DownloadDocumentAPIDocs()
  async downloadDocument(
    @Param('documentId') documentId: string,
    @Res() res,
  ) {
    const result = await this.downloadDocumentUseCase.execute(documentId);
    
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.fileName}"`,
      'Content-Length': result.fileSize.toString(),
    });
    
    res.send(result.fileBuffer);
  }



  @Get('/docs/swagger.json')
  @ApiExcludeEndpoint()
  async getSwaggerJson(@Res() res) {
    return createSwaggerResponse(
      res,
      PolicyApiModule,
      'Insurance Portal API',
      'Insurance Portal API Documentation',
    );
  }
}

// Swagger Documentation Decorators
function GetPoliciesAPIDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Retrieve all policies for the authenticated user' }),
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by property type' }),
    ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by policy status' }),
    ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Policies retrieved successfully',
      type: [PropertyResponseDto],
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - Invalid credentials',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
    }),
  );
}

function GetClaimsAPIDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Retrieve all claims for the authenticated user' }),
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    ApiQuery({ name: 'damageType', required: false, type: String, description: 'Filter by damage type' }),
    ApiQuery({ name: 'progress', required: false, type: String, description: 'Filter by claim progress' }),
    ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Filter by date from (YYYY-MM-DD)' }),
    ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Filter by date to (YYYY-MM-DD)' }),
    ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Claims retrieved successfully',
      type: [ClaimResponseDto],
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - Invalid credentials',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
    }),
  );
}

function GetDocumentsAPIDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Retrieve all documents for the authenticated user' }),
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' }),
    ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by document type' }),
    ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' }),
    ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Filter by upload date from (YYYY-MM-DD)' }),
    ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Filter by upload date to (YYYY-MM-DD)' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Documents retrieved successfully',
      type: [DocumentResponseDto],
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - Invalid credentials',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
    }),
  );
}

function DownloadDocumentAPIDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Download a specific document' }),
    ApiParam({ name: 'documentId', type: String, description: 'Document ID to download' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Document downloaded successfully',
      headers: {
        'Content-Type': { description: 'MIME type of the document' },
        'Content-Disposition': { description: 'Attachment filename' },
        'Content-Length': { description: 'File size in bytes' },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Document not found',
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Not authorized to access this document',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - Invalid credentials',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
    }),
  );
}

 