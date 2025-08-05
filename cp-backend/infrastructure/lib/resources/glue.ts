/**
 * Author: Thushara Fernando (thushara.fernando@mitrai.com)
 * Created on: 10-09-2024
 * Description: Glue Database and Table Construct
 * Module: PCP API infrastructure
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_glue as glue } from 'aws-cdk-lib';
import { envSpecificParam, getEnvironment } from '../../utils';
import * as envFile from '../../../environment/env.json';
import { CfnDatabase, CfnTable } from 'aws-cdk-lib/aws-glue';
import { S3BucketsConstruct } from './s3-buckets';

export class GlueConstruct extends Construct {
  public readonly auditDatabase: CfnDatabase;
  public readonly auditTable: CfnTable;
  public readonly auditQueryTable: CfnTable;

  constructor(scope: Construct, id: string, s3Buckets: S3BucketsConstruct) {
    super(scope, id);

    const env = getEnvironment(this.node);

    // Use stable bucket reference
    const auditLogsBucket = s3Buckets.auditBucket;
    if (!auditLogsBucket) {
      throw new Error(`Audit logs bucket not found`);
    }

    // Glue Database with stable logical ID
    this.auditDatabase = new glue.CfnDatabase(
      this,
      'AuditLogsDatabase', // Stable logical ID
      {
        catalogId: cdk.Aws.ACCOUNT_ID,
        databaseInput: {
          name: envSpecificParam(env, envFile.audit.auditGlue.databaseName),
          description: 'Database for storing audit log table metadata',
        },
      },
    );

    // Glue Table for audit logs with stable logical ID
    this.auditTable = new glue.CfnTable(
      this,
      'AuditLogsTable', // Stable logical ID
      {
        catalogId: cdk.Aws.ACCOUNT_ID,
        databaseName: this.auditDatabase.ref,
        tableInput: {
          name: envSpecificParam(env, envFile.audit.auditGlue.tableName),
          owner: 'owner',
          retention: 0,
          description: 'Table for audit logs stored in Parquet format',
          storageDescriptor: {
            columns: [
              { name: 'id', type: 'string', comment: 'Unique identifier' },
              { name: 'method', type: 'string', comment: 'HTTP method' },
              { name: 'path', type: 'string', comment: 'API path' },
              { name: 'user', type: 'string', comment: 'User identifier' },
              { name: 'requestId', type: 'string', comment: 'Request ID' },
              { name: 'function', type: 'string', comment: 'Lambda function name' },
              { name: 'service', type: 'string', comment: 'Service name' },
              { name: 'recordedTime', type: 'timestamp', comment: 'Timestamp when recorded' },
            ],
            location: `s3://${auditLogsBucket.bucketName}/audit_logs/`,
            inputFormat:
              'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat',
            outputFormat:
              'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat',
            compressed: false,
            serdeInfo: {
              serializationLibrary:
                'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe',
              parameters: { 'serialization.format': '1' },
            },
            bucketColumns: [],
            sortColumns: [],
            storedAsSubDirectories: false,
          },
          partitionKeys: [
            { name: 'year', type: 'string', comment: 'Year partition' },
            { name: 'month', type: 'string', comment: 'Month partition' },
            { name: 'day', type: 'string', comment: 'Day partition' },
            { name: 'hour', type: 'string', comment: 'Hour partition' },
          ],
          tableType: 'EXTERNAL_TABLE',
        },
      },
    );

    // Query table with stable logical ID  
    this.auditQueryTable = new glue.CfnTable(this, 'AuditLogsQueryTable', { // Stable logical ID
      catalogId: cdk.Aws.ACCOUNT_ID,
      databaseName: this.auditDatabase.ref,
      tableInput: {
        name: envSpecificParam(env, envFile.audit.auditGlue.queryTableName),
        owner: 'owner',
        retention: 0,
        description: 'Optimized table for querying audit logs',
        storageDescriptor: {
          columns: [
            { name: 'id', type: 'string', comment: 'Unique identifier' },
            { name: 'method', type: 'string', comment: 'HTTP method' },
            { name: 'path', type: 'string', comment: 'API path' },
            { name: 'user', type: 'string', comment: 'User identifier' },
            { name: 'requestId', type: 'string', comment: 'Request ID' },
            { name: 'function', type: 'string', comment: 'Lambda function name' },
            { name: 'service', type: 'string', comment: 'Service name' },
            { name: 'recordedTime', type: 'timestamp', comment: 'Timestamp when recorded' },
          ],
          location: `s3://${auditLogsBucket.bucketName}/audit_logs/`,
          inputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
          outputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
          compressed: false,
          numberOfBuckets: -1,
          serdeInfo: {
            serializationLibrary: 'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe',
            parameters: {
              'serialization.format': '1',
            },
          },
          bucketColumns: [],
          sortColumns: [],
          storedAsSubDirectories: false,
        },
        partitionKeys: [
          { name: 'year', type: 'string', comment: 'Year partition' },
          { name: 'month', type: 'string', comment: 'Month partition' },
          { name: 'day', type: 'string', comment: 'Day partition' },
          { name: 'hour', type: 'string', comment: 'Hour partition' },
        ],
        tableType: 'EXTERNAL_TABLE',
      },
    });

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'GlueDatabaseNameOutput', {
      key: envSpecificParam(env, 'GlueDatabaseName', ''),
      exportName: envSpecificParam(env, 'GlueDatabaseName', ''),
      value: this.auditDatabase.ref,
      description: 'Glue database name for audit logs',
    });

    new cdk.CfnOutput(this, 'GlueTableNameOutput', {
      key: envSpecificParam(env, 'GlueTableName', ''),
      exportName: envSpecificParam(env, 'GlueTableName', ''),
      value: this.auditTable.ref,
      description: 'Glue table name for audit logs',
    });
  }
}
