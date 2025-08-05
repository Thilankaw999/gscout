/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: Application Infrastructure Stack - Stateless Resources
 * Module: PCP Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { getEnvironment, envSpecificParam } from '../utils';
import { CognitoAuthConstruct } from './resources/congnito-userpool';
import { S3BucketsConstruct } from './resources/s3-buckets';
import { GlueConstruct } from './resources/glue';
import { KinesisConstruct } from './resources/kinesis';

export interface InfrastructureStackProps extends cdk.StackProps {
  // Database connection details can be passed as props or imported from exports
  databaseEndpoint?: string;
  databasePort?: number;
  databaseSecretArn?: string;
  lambdaSecurityGroupId?: string;
}

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: InfrastructureStackProps) {
    super(scope, id, props);

    // Read the stage value from context
    const env = getEnvironment(this.node);

    new CognitoAuthConstruct(this, envSpecificParam(env, 'cognito'));

    const s3Buckets = new S3BucketsConstruct(
      this,
      envSpecificParam(env, 's3-bucket'),
    );

    // const glueTables = new GlueConstruct(
    //   this,
    //   envSpecificParam(env, 'pcp-api-glue'),
    //   s3Buckets,
    // );

    // new KinesisConstruct(
    //   this,
    //   envSpecificParam(env, 'pcp-api-kinesis'),
    //   s3Buckets,
    //   glueTables,
    // );

    // RDS is now in a separate DatabaseStack for better lifecycle management
    // Database connection details can be imported via CloudFormation exports or passed as props
    
    // Example of how to reference database from another stack:
    // const dbEndpoint = cdk.Fn.importValue(envSpecificParam(env, 'DatabaseEndpoint', ''));
    // const dbSecretArn = cdk.Fn.importValue(envSpecificParam(env, 'DatabaseSecretArn', ''));
    
    new cdk.CfnOutput(this, 'ApplicationStackNote', {
      value: 'RDS resources moved to separate DatabaseStack for better lifecycle management',
      description: 'Note about database stack separation'
    });
  }
}
