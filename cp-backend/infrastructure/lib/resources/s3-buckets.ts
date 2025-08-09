/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: S3BucketsConstruct for Girl Scouts OCR POC
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { envSpecificParam, getEnvironment, toCamelCase } from '../../utils';
import * as envFile from '../../../environment/env.json';

interface BucketConfig {
  bucketName: string;
  logicalId: string;
  description: string;
}

export class S3BucketsConstruct extends Construct {
  public readonly buckets: Map<string, s3.Bucket> = new Map();
  public readonly mainBucket!: s3.Bucket; // Main bucket for TFR documents
  public readonly auditBucket!: s3.Bucket; // Definite assignment assertion

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const env = getEnvironment(this.node);

    const bucketConfigs: BucketConfig[] = [
      {
        bucketName: envFile.buckets.documents,
        logicalId: 'TfrDocumentsBucket',
        description: 'Bucket for storing TFR documents and bank statements',
      },
      {
        bucketName: envFile.buckets.audit,
        logicalId: 'AuditLogsBucket',
        description: 'Bucket for storing audit logs',
      },
    ];

    bucketConfigs.forEach((config) => {
      const { bucketName, logicalId, description } = config;

      const bucket = new s3.Bucket(this, logicalId, {
        bucketName: `${bucketName}-${env}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        versioned: env === 'prod',
        publicReadAccess: false,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: env !== 'prod',
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            enabled: true,
            noncurrentVersionExpiration: cdk.Duration.days(30),
            abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
          },
          {
            id: 'DeleteTempDocuments',
            enabled: true,
            prefix: 'temp-documents/',
            expiration: cdk.Duration.days(1),
          },
        ],
      });

      this.buckets.set(`${bucketName}-${env}`, bucket);
      
      if (`${bucketName}-${env}` === `${envFile.buckets.documents}-${env}`) {
        (this as any).mainBucket = bucket;
      } else if (`${bucketName}-${env}` === `${envFile.buckets.audit}-${env}`) {
        (this as any).auditBucket = bucket;
      }

      new cdk.CfnOutput(this, `${logicalId}NameOutput`, {
        key: envSpecificParam(env, `${toCamelCase(bucketName)}Name`, ''),
        value: bucket.bucketName,
        exportName: envSpecificParam(env, `${bucketName}Name`, ''),
        description: `${description} - Bucket name`,
      });

      new cdk.CfnOutput(this, `${logicalId}ArnOutput`, {
        key: envSpecificParam(env, `${toCamelCase(bucketName)}Arn`, ''),
        value: bucket.bucketArn,
        exportName: envSpecificParam(env, `${bucketName}Arn`, ''),
        description: `${description} - Bucket ARN`,
      });
    });
  }

  getBucket(bucketName: string): s3.Bucket | undefined {
    return this.buckets.get(bucketName);
  }
}
