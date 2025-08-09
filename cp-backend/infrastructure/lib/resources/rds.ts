/**
 * Author: Assistant
 * Created on: 2024-12-21
 * Description: MySQL RDS Construct
 * Module: Girl Scouts OCR POC Infrastructure
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { envSpecificParam, getEnvironment } from '../../utils';

export interface RdsConstructProps {
  vpc?: ec2.IVpc;
}

export class RdsConstruct extends Construct {
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  public readonly dbSecret: secretsmanager.Secret;
  public readonly dbEndpoint: string;
  public readonly dbPort: number;
  public readonly vpc: ec2.IVpc;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: RdsConstructProps) {
    super(scope, id);

    const env = getEnvironment(this.node);

    // Use provided VPC or get default VPC
    this.vpc =
      props?.vpc ||
      ec2.Vpc.fromLookup(this, 'DefaultVPC', {
        isDefault: true,
      });

    // Create a security group for the RDS instance
    this.dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'GirlScoutsRdsSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for Girl Scouts OCR MySQL RDS instance',
        allowAllOutbound: true,
      },
    );

    // Create a security group for Lambda functions to access RDS
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'GirlScoutsLambdaRdsSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Girl Scouts OCR Security group for Lambda functions to access RDS',
        allowAllOutbound: true,
      },
    );

    // Allow Lambda security group to access RDS on MySQL port
    this.dbSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(3306),
      'Girl Scouts OCR Allow Lambda functions to access MySQL',
    );

    // Allow public access for development/debugging (remove in production)
    this.dbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3306),
      'Girl Scouts OCR Allow public access for development',
    );

    // Create a secret for database credentials
    this.dbSecret = new secretsmanager.Secret(this, 'GirlScoutsRdsSecret', {
      secretName: envSpecificParam(env, 'girl-scouts-ocr-db-secret'),
      description: 'Girl Scouts OCR MySQL database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'girl_scouts_admin',
        }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        passwordLength: 16,
      },
    });

    // Create the MySQL RDS instance
    this.dbInstance = new rds.DatabaseInstance(this, 'GirlScoutsDBInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO, // t3.nano not available for MySQL, use t3.micro
      ),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Use public subnets instead of private
      },
      securityGroups: [this.dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      databaseName: `girl_scouts_ocr_db_${env}`, // Valid database name: starts with letter, alphanumeric only
      instanceIdentifier: envSpecificParam(env, 'girl-scouts-ocr-db'),

      // Storage configuration
      storageType: rds.StorageType.GP2,
      allocatedStorage: 20, // GB
      maxAllocatedStorage: 20, // GB for auto-scaling

      deleteAutomatedBackups: env === 'prod' ? false : true,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,

      deletionProtection: env === 'prod' ? true : false, // Protect production databases
      storageEncrypted: true,
      multiAz: false, // Set to true for production
      // Monitoring
      autoMinorVersionUpgrade: true,
      // Network configuration
      publiclyAccessible: true, // Set to true for development/debugging
      port: 3306,
    });

    // Store the endpoint and port for easy access
    this.dbEndpoint = this.dbInstance.instanceEndpoint.hostname;
    this.dbPort = 3306;

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'GirlScoutsRdsEndpointOutput', {
      key: envSpecificParam(env, 'GirlScoutsDBEndpoint', ''),
      exportName: envSpecificParam(env, 'GirlScoutsDBEndpoint', ''),
      value: this.dbEndpoint,
    });

    new cdk.CfnOutput(this, 'GirlScoutsRdsPortOutput', {
      key: envSpecificParam(env, 'GirlScoutsDBPort', ''),
      exportName: envSpecificParam(env, 'GirlScoutsDBPort', ''),
      value: this.dbPort.toString(),
    });

    new cdk.CfnOutput(this, 'GirlScoutsRdsSecurityGroupOutput', {
      key: envSpecificParam(env, 'GirlScoutsDBSecurityGroup', ''),
      exportName: envSpecificParam(env, 'GirlScoutsDBSecurityGroup', ''),
      value: this.dbSecurityGroup.securityGroupId,
    });

    new cdk.CfnOutput(this, 'GirlScoutsLambdaSecurityGroupOutput', {
      key: envSpecificParam(env, 'GirlScoutsLambdaRdsSecurityGroup', ''),
      exportName: envSpecificParam(env, 'GirlScoutsLambdaRdsSecurityGroup', ''),
      value: this.lambdaSecurityGroup.securityGroupId,
    });

    new cdk.CfnOutput(this, 'GirlScoutsRdsSecretArnOutput', {
      key: envSpecificParam(env, 'GirlScoutsDBSecretArn', ''),
      exportName: envSpecificParam(env, 'GirlScoutsDBSecretArn', ''),
      value: this.dbSecret.secretArn,
    });
  }
}
