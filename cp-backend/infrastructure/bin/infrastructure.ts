#!/usr/bin/env node
/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: CDK App Entry Point
 * Module: PCP Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure';
import { DatabaseStack } from '../lib/database-stack';

const app = new cdk.App();

// Set all context BEFORE creating any stacks
app.node.setContext('@aws-cdk/core:stackRelativeExports', true);

// Get environment from context
const projectName = app.node.tryGetContext('project-name') || 'pcp';
const env = app.node.tryGetContext('env') || 'dev';
const profile = app.node.tryGetContext('profile');

const stackProps: cdk.StackProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  // Add tags to all resources
  tags: {
    Project: projectName,
    Environment: env,
    ManagedBy: 'CDK',
  },
};

// 1. Deploy Database Stack first (stateful resources)
const databaseStack = new DatabaseStack(app, `${projectName}-${env}-database-stack`, {
  ...stackProps,
  description: `${projectName} Database Stack - Stateful resources for ${env} environment`,
});

// 2. Deploy Application Infrastructure Stack (stateless resources)
const infrastructureStack = new InfrastructureStack(app, `${projectName}-${env}-infrastructure-stack`, {
  ...stackProps,
  description: `${projectName} Application Infrastructure Stack - Stateless resources for ${env} environment`,
});

// Add explicit dependency to ensure database stack deploys first
infrastructureStack.addDependency(databaseStack);

// Output deployment order information
console.log(`\n🗄️  Database Stack: ${databaseStack.stackName}`);
console.log(`🏗️  Infrastructure Stack: ${infrastructureStack.stackName}`);
console.log(`\nℹ️  Deploy order: Database stack will be deployed first, followed by Infrastructure stack\n`);
