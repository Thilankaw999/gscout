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
import { GirlScoutsOcrStack } from '../lib/girl-scouts-ocr-stack';
import { BedrockAgentStack } from '../lib/bedrock-agent-stack';

const app = new cdk.App();

// Set all context BEFORE creating any stacks
app.node.setContext('@aws-cdk/core:stackRelativeExports', true);

// Get environment from context
const projectName = app.node.tryGetContext('project-name') || 'girl-scouts';
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

// 3. Deploy Girl Scouts OCR Stack (OCR processing resources)
const ocrStack = new GirlScoutsOcrStack(app, `${projectName}-${env}-ocr-stack`, {
  ...stackProps,
  description: `${projectName} OCR Processing Stack - OCR and document processing resources for ${env} environment`,
  stage: env,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
});

// 4. Deploy Bedrock Agent Stack (AI chatbot resources)
const bedrockAgentStack = new BedrockAgentStack(app, `${projectName}-${env}-bedrock-agent-stack`, {
  ...stackProps,
  description: `${projectName} Bedrock Agent Stack - AI chatbot and form processing resources for ${env} environment`,
  stage: env,
  foundationModel: 'apac.anthropic.claude-3-5-sonnet-20240620-v1:0',
  idleSessionTimeout: 600,
});

// Add explicit dependencies
infrastructureStack.addDependency(databaseStack);
ocrStack.addDependency(infrastructureStack);
// bedrockAgentStack.addDependency(infrastructureStack); // Removed dependency to make it standalone

// Output deployment order information
console.log(`\n🗄️  Database Stack: ${databaseStack.stackName}`);
console.log(`🏗️  Infrastructure Stack: ${infrastructureStack.stackName}`);
console.log(`📄  OCR Processing Stack: ${ocrStack.stackName}`);
console.log(`🤖  Bedrock Agent Stack: ${bedrockAgentStack.stackName} (standalone)`);
console.log(`\nℹ️  Deploy order: Database → Infrastructure → OCR Processing`);
console.log(`ℹ️  Bedrock Agent Stack can be deployed independently\n`);
