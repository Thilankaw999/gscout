/**
 * Author: Assistant
 * Created on: 2024-12-21
 * Description: Database Stack - Stateful Resources
 * Module: Girl Scouts OCR POC Infrastructure
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { getEnvironment, envSpecificParam } from '../utils';
import { RdsConstruct } from './resources/rds';

export interface DatabaseStackProps extends cdk.StackProps {
  // Add any props needed for database configuration
}

export class DatabaseStack extends cdk.Stack {
  public readonly rdsConstruct: RdsConstruct;
  public readonly dbEndpoint: string;
  public readonly dbPort: number;
  public readonly dbSecretArn: string;
  public readonly lambdaSecurityGroupId: string;
  public readonly vpcId: string;
  public readonly subnetIds: string[];

  constructor(scope: Construct, id: string, props?: DatabaseStackProps) {
    super(scope, id, props);

    // CRITICAL: Enable termination protection for production databases
    this.terminationProtection = true;
    
    const env = getEnvironment(this.node);

    // Create RDS MySQL instance
    this.rdsConstruct = new RdsConstruct(this, envSpecificParam(env, 'girl-scouts-ocr-mysql-rds'));

    // Store outputs for cross-stack references
    this.dbEndpoint = this.rdsConstruct.dbEndpoint;
    this.dbPort = this.rdsConstruct.dbPort;
    this.dbSecretArn = this.rdsConstruct.dbSecret.secretArn;
    this.lambdaSecurityGroupId = this.rdsConstruct.lambdaSecurityGroup.securityGroupId;
    this.vpcId = this.rdsConstruct.vpc.vpcId;
    this.subnetIds = this.rdsConstruct.vpc.publicSubnets.map(subnet => subnet.subnetId);

    // Export values for other stacks to import
    new cdk.CfnOutput(this, 'DatabaseEndpointExport', {
      key: envSpecificParam(env, 'GirlScoutsDatabaseEndpoint', ''),
      exportName: envSpecificParam(env, 'GirlScoutsDatabaseEndpoint', ''),
      value: this.dbEndpoint,
      description: 'Girl Scouts RDS Database endpoint for cross-stack reference'
    });

    new cdk.CfnOutput(this, 'DatabasePortExport', {
      key: envSpecificParam(env, 'GirlScoutsDatabasePort', ''),
      exportName: envSpecificParam(env, 'GirlScoutsDatabasePort', ''),
      value: this.dbPort.toString(),
      description: 'Girl Scouts RDS Database port for cross-stack reference'
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArnExport', {
      key: envSpecificParam(env, 'GirlScoutsDatabaseSecretArn', ''),
      exportName: envSpecificParam(env, 'GirlScoutsDatabaseSecretArn', ''),
      value: this.dbSecretArn,
      description: 'Girl Scouts RDS Database secret ARN for cross-stack reference'
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupExport', {
      key: envSpecificParam(env, 'GirlScoutsLambdaSecurityGroup', ''),
      exportName: envSpecificParam(env, 'GirlScoutsLambdaSecurityGroup', ''),
      value: this.lambdaSecurityGroupId,
      description: 'Girl Scouts Lambda security group ID for RDS access'
    });

    // Export VPC ID for Lambda functions
    new cdk.CfnOutput(this, 'VpcIdExport', {
      key: envSpecificParam(env, 'GirlScoutsVpcId', ''),
      exportName: envSpecificParam(env, 'GirlScoutsVpcId', ''),
      value: this.vpcId,
      description: 'Girl Scouts VPC ID where RDS instance is deployed'
    });

    // Export subnet IDs for Lambda functions
    new cdk.CfnOutput(this, 'SubnetIdsExport', {
      key: envSpecificParam(env, 'GirlScoutsSubnetIds', ''),
      exportName: envSpecificParam(env, 'GirlScoutsSubnetIds', ''),
      value: this.subnetIds.join(','),
      description: 'Girl Scouts Comma-separated list of public subnet IDs where Lambda functions can be deployed'
    });
  }
} 