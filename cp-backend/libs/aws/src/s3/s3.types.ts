/**
 * types.ts
 * Author: Sujeban Elankeswaran
 * Description: Defines types for S3 operations in the LiSLS Boilerplate.
 */

import {
  PutObjectCommandInput,
  GetObjectCommandInput,
  DeleteObjectCommandInput,
} from '@aws-sdk/client-s3';

/**
 * Parameters for uploading an object to S3.
 */
export interface S3UploadParams extends PutObjectCommandInput {
  /**
   * The name of the bucket where the object will be stored.
   */
  Bucket: string;

  /**
   * The key (path) within the bucket where the object will be stored.
   */
  Key: string;

  /**
   * The body of the object to be stored (e.g., file contents, string data).
   */
  Body: Buffer | Uint8Array | Blob | string | ReadableStream | undefined;
}

/**
 * Parameters for fetching an object from S3.
 */
export interface S3GetParams extends GetObjectCommandInput {
  /**
   * The name of the bucket from where the object will be fetched.
   */
  Bucket: string;

  /**
   * The key (path) within the bucket where the object is stored.
   */
  Key: string;
}

/**
 * Parameters for deleting an object from S3.
 */
export interface S3DeleteParams extends DeleteObjectCommandInput {
  /**
   * The name of the bucket from where the object will be deleted.
   */
  Bucket: string;

  /**
   * The key (path) within the bucket where the object is stored.
   */
  Key: string;
}

/**
 * Parameters for generating a signed URL to access an S3 object.
 */
export interface S3SignedUrlParams {
  /**
   * The name of the bucket where the object is stored.
   */
  Bucket: string;

  /**
   * The key (path) within the bucket where the object is stored.
   */
  Key: string;

  /**
   * Expiry time in seconds for the signed URL.
   */
  ExpiresIn?: number;

  /**
   * Optional content type for the file being accessed.
   */
  ResponseContentType?: string;
}

/**
 * Represents the result of a successful S3 operation.
 */
export interface S3OperationResult {
  /**
   * A message ID or unique identifier for the operation.
   */
  messageId?: string;

  /**
   * Any additional metadata returned by the S3 operation.
   */
  metadata?: Record<string, any>;
}

export interface S3PostSignedUrlParams {
  /**
   * The name of the bucket where the object is stored.
   */
  Bucket: string;

  /**
   * The key (path) within the bucket where the object is stored.
   */
  Key: string;

  /**
   * Expiry time in seconds for the signed URL.
   */
  ExpiresIn?: number;

  /**
   * Optional content type for the file being accessed.
   */
  content?: string;

  /**
   * Optional file size limit for the signed url.
   */
  limitFileSize?: number;
}
