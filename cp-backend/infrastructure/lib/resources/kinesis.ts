/**
 * Author: Thushara Fernando (thushara.fernando@mitrai.com)
 * Created on: 10-09-2024
 * Description: Kinesis Firehose Delivery Stream Construct
 * Module: PCP API infrastructure
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Role,
  ServicePrincipal,
  PolicyStatement,
  PolicyDocument,
  Effect,
} from 'aws-cdk-lib/aws-iam';
import { CfnDeliveryStream } from 'aws-cdk-lib/aws-kinesisfirehose';
import { envSpecificParam, getEnvironment } from '../../utils';
import * as envFile from '../../../environment/env.json';
import { S3BucketsConstruct } from './s3-buckets';
import { GlueConstruct } from './glue';

export class KinesisConstruct extends Construct {
  public readonly deliveryRole: Role;
  public readonly deliveryStream: CfnDeliveryStream;

  constructor(
    scope: Construct,
    id: string,
    s3Buckets: S3BucketsConstruct,
    glueTables: GlueConstruct,
  ) {
    super(scope, id);

    const env = getEnvironment(this.node);

    // Use stable bucket reference
    const auditLogsBucket = s3Buckets.auditBucket;
    if (!auditLogsBucket) {
      throw new Error(`Audit logs bucket not found`);
    }

    // Define the IAM Role with stable logical ID
    this.deliveryRole = new Role(this, 'AuditDeliveryRole', { // Stable logical ID
      roleName: envSpecificParam(env, 'pcp-api-audit-delivery-role'),
      description: 'Role for Kinesis Firehose to deliver audit logs to S3',
      assumedBy: new ServicePrincipal('firehose.amazonaws.com'),
      inlinePolicies: {
        FirehoseDeliveryToS3Policy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              sid: 'S3DeliveryAccess',
              actions: [
                's3:AbortMultipartUpload',
                's3:GetBucketLocation',
                's3:GetObject',
                's3:ListBucket',
                's3:ListBucketMultipartUploads',
                's3:PutObject',
              ],
              resources: [
                auditLogsBucket.bucketArn, 
                `${auditLogsBucket.bucketArn}/*`
              ],
              effect: Effect.ALLOW,
            }),
            new PolicyStatement({
              sid: 'GlueTableAccess',
              actions: [
                'glue:GetTableVersions',
                'glue:GetTable',
                'glue:GetDatabase',
              ],
              resources: [
                `arn:aws:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:catalog`,
                `arn:aws:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:database/${glueTables.auditDatabase.ref}`,
                `arn:aws:glue:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:table/${glueTables.auditDatabase.ref}/${glueTables.auditTable.ref}`,
              ],
              effect: Effect.ALLOW,
            }),
          ],
        }),
      },
    });

    // Define the Kinesis Firehose Delivery Stream with stable logical ID
    this.deliveryStream = new CfnDeliveryStream(
      this,
      'AuditEventDeliveryStream', // Stable logical ID
      {
        deliveryStreamType: 'DirectPut',
        deliveryStreamName: envSpecificParam(
          env,
          envFile.audit.kinesis.auditEventDeliveryStream,
        ),
        extendedS3DestinationConfiguration: {
          roleArn: this.deliveryRole.roleArn,
          bucketArn: auditLogsBucket.bucketArn,
          prefix: `audit_logs/year=!{timestamp:YYYY}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/`,
          errorOutputPrefix: `audit_errors/!{firehose:error-output-type}/year=!{timestamp:YYYY}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/`,
          bufferingHints: {
            intervalInSeconds: 60, // Buffer for 1 minute
            sizeInMBs: 64, // Buffer up to 64MB
          },
          compressionFormat: 'GZIP', // Enable compression for cost savings
          encryptionConfiguration: {
            noEncryptionConfig: 'NoEncryption', // Use bucket-level encryption
          },
          s3BackupMode: 'Disabled',
          dataFormatConversionConfiguration: {
            enabled: true,
            schemaConfiguration: {
              catalogId: cdk.Aws.ACCOUNT_ID,
              roleArn: this.deliveryRole.roleArn,
              databaseName: glueTables.auditDatabase.ref,
              tableName: glueTables.auditTable.ref,
              region: cdk.Aws.REGION,
              versionId: 'LATEST',
            },
            inputFormatConfiguration: {
              deserializer: {
                openXJsonSerDe: {},
              },
            },
            outputFormatConfiguration: {
              serializer: {
                parquetSerDe: {},
              },
            },
          },
          cloudWatchLoggingOptions: {
            enabled: true,
            logGroupName: `/aws/kinesisfirehose/${envSpecificParam(env, envFile.audit.kinesis.auditEventDeliveryStream)}`,
          },
        },
      },
    );

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'DeliveryStreamNameOutput', {
      key: envSpecificParam(env, 'KinesisDeliveryStreamName', ''),
      exportName: envSpecificParam(env, 'KinesisDeliveryStreamName', ''),
      value: this.deliveryStream.ref,
      description: 'Kinesis Firehose delivery stream name for audit logs',
    });

    new cdk.CfnOutput(this, 'DeliveryRoleArnOutput', {
      key: envSpecificParam(env, 'KinesisDeliveryRoleArn', ''),
      exportName: envSpecificParam(env, 'KinesisDeliveryRoleArn', ''),
      value: this.deliveryRole.roleArn,
      description: 'IAM role ARN for Kinesis Firehose delivery',
    });
  }
}
