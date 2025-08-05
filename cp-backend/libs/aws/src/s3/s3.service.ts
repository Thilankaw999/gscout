/**
 * s3.service.ts
 * Author: Sujeban Elankeswaran
 * Description: AWS S3 Service for file management and signed URL generation.
 * Module: LiSLS Boilerplate
 */

import { Injectable } from '@nestjs/common';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandOutput,
  ListObjectsV2Command,
  GetObjectCommandInput,
  HeadObjectCommandOutput,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  createPresignedPost,
  PresignedPostOptions,
} from '@aws-sdk/s3-presigned-post';
import { Readable } from 'stream';
import {
  S3UploadParams,
  S3GetParams,
  S3DeleteParams,
  S3SignedUrlParams,
  S3OperationResult,
  S3PostSignedUrlParams,
} from './s3.types';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({ region: process.env.AWS_REGION });
  }

  /**
   * Uploads a file to S3.
   * @param params.Bucket - The name of the S3 bucket to upload the file to.
   * @param params.Key - The key (path and filename) for the file in the bucket.
   * @param params.Body - The content of the file to be uploaded.
   * @returns A promise with the result of the upload operation, including a message ID.
   */
  async uploadFile(params: S3UploadParams): Promise<S3OperationResult> {
    const command = new PutObjectCommand(params);
    const result: PutObjectCommandOutput = await this.s3Client.send(command);
    return { messageId: result.ETag };
  }

  /**
   * Retrieves a file from S3.
   * @param params.Bucket - The name of the S3 bucket where the file is stored.
   * @param params.Key - The key (path and filename) for the file in the bucket.
   * @returns A promise with the file's content as a readable stream.
   */
  async getFile(params: S3GetParams): Promise<Readable> {
    const command = new GetObjectCommand(params);
    const response = await this.s3Client.send(command);
    return response.Body as Readable;
  }

  /**
   * Deletes a file from S3.
   * @param params.Bucket - The name of the S3 bucket where the file is stored.
   * @param params.Key - The key (path and filename) for the file in the bucket.
   * @returns A promise with the result of the delete operation, including a message ID.
   */
  async deleteFile(params: S3DeleteParams): Promise<S3OperationResult> {
    const command = new DeleteObjectCommand(params);
    await this.s3Client.send(command);
    return { messageId: `Deleted ${params.Key}` };
  }

  /**
   * Generates a pre-signed URL for accessing a file in S3.
   * @param params.Bucket - The name of the S3 bucket where the file is stored.
   * @param params.Key - The key (path and filename) for the file in the bucket.
   * @param params.ExpiresIn - Optional expiration time in seconds for the URL (default is 3600 seconds).
   * @returns A promise with the signed URL string.
   */
  async generateSignedUrl(params: S3SignedUrlParams): Promise<string> {
    const commandParams: GetObjectCommandInput = {
      Bucket: params.Bucket,
      Key: params.Key,
    };

    if (params.ResponseContentType) {
      commandParams.ResponseContentType = params.ResponseContentType;
    }

    const command = new GetObjectCommand(commandParams);
    return await getSignedUrl(this.s3Client, command, {
      expiresIn: params.ExpiresIn || 3600,
    });
  }

  /**
   * Generates a pre-signed URL for upload a file in S3.
   * @param params.Bucket - The name of the S3 bucket where the file is stored.
   * @param params.Key - The key (path and filename) for the file in the bucket.
   * @param params.ExpiresIn - Optional expiration time in seconds for the URL (default is 3600 seconds).
   * @param params.limitFileSize - Optional limitFileSize in MB for the URL (default is 10MB).
   * @returns A promise with the signed URL string.
   */
  async generatePostSignedUrl(
    params: S3PostSignedUrlParams,
  ): Promise<{ url: string; config: object }> {
    const commandParams: PresignedPostOptions = {
      Bucket: params.Bucket,
      Key: params.Key,
      Expires: params.ExpiresIn || 3600,
      Conditions: [
        ['content-length-range', 0, (params.limitFileSize ?? 10) * 1024 * 1024], //default Min 0MB, Max 10MB
        ['eq', '$Content-Type', params.content], // Enforce exact Content-Type
      ],
      Fields: {
        'Content-Type': params.content, // Default if missing
      },
    };
    const { url, fields } = await createPresignedPost(
      this.s3Client,
      commandParams,
    );
    return { url, config: fields };
  }
  /**
   * Retrieves a list of objects within a specified subfolder of an S3 bucket,
   * filtered by an optional file prefix. This method will fetch all objects
   * across multiple paginated requests if necessary.
   *
   * @param bucket - The name of the S3 bucket to list objects from.
   * @param subFolderPath - The prefix or path to the subfolder within the bucket.
   * @param filePrefix - An optional prefix to filter objects by filename.
   * @returns A promise that resolves to an array of all matching objects.
   */
  public async listAllObjects(
    bucket: string,
    subFolderPath: string,
    filePrefix?: string,
  ): Promise<any[]> {
    let continuationToken = null;
    const allObjects = [];

    const fullPrefix = filePrefix
      ? `${subFolderPath}/${filePrefix}`
      : subFolderPath;

    do {
      const response: any = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: fullPrefix,
          ContinuationToken: continuationToken,
        }),
      );
      const contents = response.Contents;

      if (contents) {
        allObjects.push(...contents);
      }
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return allObjects;
  }

  /**
   * Retrieves metadata for a specified file in an S3 bucket.
   * This method fetches object metadata without downloading the file content.
   *
   * @param bucket - The name of the S3 bucket where the file is stored.
   * @param filePath - The key (path and filename) for the file in the bucket.
   * @returns A promise that resolves with the file's metadata, including information like Content-Type, Content-Length, etc.
   */
  public async getMetaDataAsync(
    bucket: string,
    filePath: string,
  ): Promise<HeadObjectCommandOutput> {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: filePath,
    });
    const metadata = await this.s3Client.send(command);
    return metadata;
  }
}
