/**
 * Author: Assistant
 * Created on: 2024-12-21
 * Description: Infrastructure Tests
 * Module: PCP Infrastructure Tests
 * Copyright (c) 2024 All rights reserved.
 */

import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { InfrastructureStack } from '../lib/infrastructure';
import { DatabaseStack } from '../lib/database-stack';

describe('Infrastructure Stack Tests', () => {
  let app: cdk.App;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    app.node.setContext('env', 'test');
    app.node.setContext('stage', 'test');
  });

  describe('DatabaseStack', () => {
    test('Creates RDS instance with correct properties', () => {
      const stack = new DatabaseStack(app, 'TestDatabaseStack');
      template = Template.fromStack(stack);

      // Test RDS instance creation
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        DBInstanceClass: 'db.t3.nano',
        Port: 3306,
        PubliclyAccessible: false,
        DeletionProtection: false, // Should be false for test environment
      });
    });

    test('Creates security groups', () => {
      const stack = new DatabaseStack(app, 'TestDatabaseStack');
      template = Template.fromStack(stack);

      // Should create DB security group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for MySQL RDS instance',
      });

      // Should create Lambda security group
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'PCP Security group for Lambda functions to access RDS',
      });
    });

    test('Creates database secret', () => {
      const stack = new DatabaseStack(app, 'TestDatabaseStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'PCP API MySQL database credentials',
      });
    });
  });

  describe('InfrastructureStack', () => {
    test('Creates S3 buckets with proper configuration', () => {
      const stack = new InfrastructureStack(app, 'TestInfrastructureStack');
      template = Template.fromStack(stack);

      // Test bucket creation
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('Creates Cognito User Pool with security settings', () => {
      const stack = new InfrastructureStack(app, 'TestInfrastructureStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UserPoolName: 'pcp-api-user-pool-test',
        SelfSignUpEnabled: true, // Should be true for test environment
        MfaConfiguration: 'OPTIONAL',
        Policies: {
          PasswordPolicy: {
            MinimumLength: 12,
            RequireLowercase: true,
            RequireNumbers: true,
            RequireSymbols: true,
            RequireUppercase: true,
          },
        },
      });
    });

    test('Stack has termination protection enabled', () => {
      const stack = new InfrastructureStack(app, 'TestInfrastructureStack');
      expect(stack.terminationProtection).toBe(true);
    });
  });

  describe('Production Environment Tests', () => {
    test('Production database has deletion protection enabled', () => {
      app.node.setContext('env', 'prod');
      app.node.setContext('stage', 'prod');
      
      const stack = new DatabaseStack(app, 'ProdDatabaseStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: true,
      });
    });

    test('Production Cognito has MFA required', () => {
      app.node.setContext('env', 'prod');
      app.node.setContext('stage', 'prod');
      
      const stack = new InfrastructureStack(app, 'ProdInfrastructureStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Cognito::UserPool', {
        MfaConfiguration: 'ON',
        SelfSignUpEnabled: false, // Should be disabled in production
      });
    });
  });

  describe('Cross-Stack Dependencies', () => {
    test('Infrastructure stack can reference database stack outputs', () => {
      const dbStack = new DatabaseStack(app, 'TestDatabaseStack');
      const infraStack = new InfrastructureStack(app, 'TestInfrastructureStack');

      // Ensure both stacks can be synthesized without errors
      expect(() => app.synth()).not.toThrow();
    });
  });

  describe('Logical ID Stability', () => {
    test('Resource logical IDs are stable across deployments', () => {
      const stack1 = new InfrastructureStack(app, 'TestStack1');
      const template1 = Template.fromStack(stack1);

      const stack2 = new InfrastructureStack(app, 'TestStack2');
      const template2 = Template.fromStack(stack2);

      // Get all resource types from both templates
      const resources1 = template1.toJSON().Resources;
      const resources2 = template2.toJSON().Resources;

      // Logical IDs should be consistent
      const logicalIds1 = Object.keys(resources1);
      const logicalIds2 = Object.keys(resources2);

      expect(logicalIds1.sort()).toEqual(logicalIds2.sort());
    });
  });
});
