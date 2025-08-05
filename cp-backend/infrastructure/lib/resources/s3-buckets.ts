/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: S3BucketsConstruct
 * Module: PCP Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
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
  public readonly deploymentsBucket!: s3.Bucket; // Definite assignment assertion  
  public readonly auditBucket!: s3.Bucket; // Definite assignment assertion

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const env = getEnvironment(this.node);

    const bucketConfigs: BucketConfig[] = [
      {
        bucketName: 'pcp-api-deployments',
        logicalId: 'DeploymentsBucket',
        description: 'Bucket for storing deployment artifacts',
      },
      {
        bucketName: envFile.audit.s3.bucketName,
        logicalId: 'AuditLogsBucket',
        description: 'Bucket for storing audit logs',
      },
    ];

    bucketConfigs.forEach((config) => {
      const { bucketName, logicalId, description } = config;

      const bucket = new s3.Bucket(this, logicalId, {
        bucketName: envSpecificParam(env, bucketName),
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
        ],
      });

      this.buckets.set(bucketName, bucket);
      
      if (bucketName === 'pcp-api-deployments') {
        (this as any).deploymentsBucket = bucket;
      } else if (bucketName === envFile.audit.s3.bucketName) {
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
