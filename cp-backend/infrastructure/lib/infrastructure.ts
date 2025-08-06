/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Application Infrastructure Stack - Core Resources for Girl Scouts OCR POC
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { getEnvironment, envSpecificParam } from '../utils';
import { CognitoAuthConstruct } from './resources/congnito-userpool';
import { S3BucketsConstruct } from './resources/s3-buckets';

import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as fs from 'fs';
import * as path from 'path';

export interface InfrastructureStackProps extends cdk.StackProps {
  // Database connection details can be passed as props or imported from exports
  databaseEndpoint?: string;
  databasePort?: number;
  databaseSecretArn?: string;
  lambdaSecurityGroupId?: string;
}

export class InfrastructureStack extends cdk.Stack {
  public readonly dummyAuthSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props?: InfrastructureStackProps) {
    super(scope, id, props);

    // Read the stage value from context
    const env = getEnvironment(this.node);

    new CognitoAuthConstruct(this, envSpecificParam(env, 'cognito'));

    const s3Buckets = new S3BucketsConstruct(
      this,
      envSpecificParam(env, 's3-bucket'),
    );

    // Create dummy authentication secret for Girl Scouts OCR POC
    this.dummyAuthSecret = this.createDummyAuthSecret(env);

    new cdk.CfnOutput(this, 'InfrastructureStackNote', {
      value: 'Core infrastructure for Girl Scouts OCR POC - S3 buckets and Cognito authentication',
      description: 'Girl Scouts OCR POC Infrastructure Stack'
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Buckets.mainBucket.bucketName,
      description: 'Main S3 bucket for TFR documents',
      exportName: `${this.stackName}-MainBucketName`
    });
  }

  /**
   * Get configuration value from environment file
   */
  private getConfigValue(key: string): string | undefined {
    try {
      const envFilePath = path.resolve(__dirname, '../../environment/env.json');
      const envConfig = JSON.parse(fs.readFileSync(envFilePath, 'utf8'));
      
      // Support dot notation for nested keys (e.g., 'database.host')
      const keys = key.split('.');
      let value = envConfig;
      
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) break;
      }
      
      return value;
    } catch (error) {
      console.warn(`Could not read config value '${key}':`, (error as Error).message);
      return undefined;
    }
  }

  private createDummyAuthSecret(env: string): secretsmanager.Secret {
    const dummyAuthSecret = new secretsmanager.Secret(this, 'DummyAuthSecret', {
      secretName: 'third-party/its-api/auth-key',
      description: 'Dummy authentication credentials for development and testing',
      secretStringValue: cdk.SecretValue.unsafePlainText(JSON.stringify({
        auth_key: 'C68AA04D162E40668FC32D83AA2367E2'
      })),
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Output the secret ARN for reference
    new cdk.CfnOutput(this, 'DummyAuthSecretArnOutput', {
      key: envSpecificParam(env, 'PCPDummyAuthSecretArn', ''),
      exportName: envSpecificParam(env, 'PCPDummyAuthSecretArn', ''),
      value: dummyAuthSecret.secretArn,
      description: 'ARN of the dummy authentication secret',
    });

    return dummyAuthSecret;
  }
}
