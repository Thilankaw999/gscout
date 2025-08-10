/**
 * Author: Assistant
 * Created on: 2025-08-10
 * Description: Bedrock Agent Stack for form submission with multiple action groups
 * Module: Girl Scouts Infrastructure
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import * as cdk from 'aws-cdk-lib';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface BedrockAgentStackProps extends cdk.StackProps {
  /**
   * The foundation model ID to use for the Bedrock agent
   * @default 'apac.anthropic.claude-3-5-sonnet-20240620-v1:0'
   */
  readonly foundationModel?: string;
  
  /**
   * The idle session timeout in seconds
   * @default 600
   */
  readonly idleSessionTimeout?: number;
  
  /**
   * Environment stage (dev, staging, prod)
   * @default 'dev'
   */
  readonly stage?: string;
}

export class BedrockAgentStack extends cdk.Stack {
  public readonly agent: bedrock.CfnAgent;
  public readonly personalInfoLambda: lambda.Function;
  public readonly vehicleDetailsLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: BedrockAgentStackProps = {}) {
    super(scope, id, props);

    const stage = props.stage || 'dev';
    const foundationModel = props.foundationModel || 'anthropic.claude-3-5-sonnet-20240620-v1:0';
    const idleSessionTimeout = props.idleSessionTimeout || 600;

    // Create Lambda execution role for personal info handler
    const personalInfoLambdaRole = new iam.Role(this, 'PersonalInfoLambdaRole', {
      roleName: `bedrock-agent-personal-info-lambda-role-${stage}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for Bedrock Agent personal info Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Create Lambda execution role for vehicle details handler
    const vehicleDetailsLambdaRole = new iam.Role(this, 'VehicleDetailsLambdaRole', {
      roleName: `bedrock-agent-vehicle-details-lambda-role-${stage}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for Bedrock Agent vehicle details Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Create Personal Info Lambda function
    this.personalInfoLambda = new lambda.Function(this, 'PersonalInfoFunction', {
      functionName: `bedrock-agent-personal-info-${stage}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.lambda_handler',
      role: personalInfoLambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      description: 'Lambda function for Bedrock agent personal info submission',
      environment: {
        STAGE: stage,
        LOG_LEVEL: 'INFO',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'personal-info-handler')),
    });

    // Create Vehicle Details Lambda function
    this.vehicleDetailsLambda = new lambda.Function(this, 'VehicleDetailsFunction', {
      functionName: `bedrock-agent-vehicle-details-${stage}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.lambda_handler',
      role: vehicleDetailsLambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      description: 'Lambda function for Bedrock agent vehicle details submission',
      environment: {
        STAGE: stage,
        LOG_LEVEL: 'INFO',
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambda', 'vehicle-details-handler')),
    });

    // Create Bedrock agent execution role
    const bedrockAgentRole = new iam.Role(this, 'BedrockAgentExecutionRole', {
      roleName: `bedrock-agent-execution-role-${stage}`,
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      description: 'Execution role for Bedrock Agent',
    });

    // Add permissions for Bedrock to invoke the foundation model
    bedrockAgentRole.addToPolicy(new iam.PolicyStatement({
      sid: "AmazonBedrockAgentInferenceProfilesCrossRegionPolicyProd",
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel*',
        'bedrock:InvokeModelWithResponseStream',
        "bedrock:GetInferenceProfile",
        "bedrock:GetFoundationModel"
      ],
      resources: ["*"
      ],
    }));

    // Add comprehensive inference profile permissions
    bedrockAgentRole.addToPolicy(new iam.PolicyStatement({
      sid: "BedrockInferenceProfileManagement",
      effect: iam.Effect.ALLOW,
      actions: [
        "bedrock:InvokeModel*",
        "bedrock:CreateInferenceProfile"
      ],
      resources: [
        "arn:aws:bedrock:*::foundation-model/*",
        "arn:aws:bedrock:*:*:inference-profile/*",
        "arn:aws:bedrock:*:*:application-inference-profile/*"
      ],
    }));

    bedrockAgentRole.addToPolicy(new iam.PolicyStatement({
      sid: "BedrockInferenceProfileOperations",
      effect: iam.Effect.ALLOW,
      actions: [
        "bedrock:GetInferenceProfile",
        "bedrock:ListInferenceProfiles",
        "bedrock:DeleteInferenceProfile",
        "bedrock:TagResource",
        "bedrock:UntagResource",
        "bedrock:ListTagsForResource"
      ],
      resources: [
        "arn:aws:bedrock:*:*:inference-profile/*",
        "arn:aws:bedrock:*:*:application-inference-profile/*"
      ],
    }));

    // Add permissions for Lambda invocation for both functions
    bedrockAgentRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'lambda:InvokeFunction',
      ],
      resources: [
        this.personalInfoLambda.functionArn,
        this.vehicleDetailsLambda.functionArn,
      ],
    }));

    // Allow Bedrock agent to invoke both Lambda functions
    this.personalInfoLambda.addPermission('AllowBedrockInvocation', {
      principal: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      sourceArn: `arn:aws:bedrock:${this.region}:${this.account}:agent/*`,
      action: 'lambda:InvokeFunction',
    });

    this.vehicleDetailsLambda.addPermission('AllowBedrockInvocation', {
      principal: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      sourceArn: `arn:aws:bedrock:${this.region}:${this.account}:agent/*`,
      action: 'lambda:InvokeFunction',
    });

    // Define the OpenAPI schema for the Personal Information action group
    const personalInfoApiSchema = {
      openapi: '3.0.0',
      info: {
        title: 'Personal Information Submission API',
        version: '1.0.0',
        description: 'An API to submit personal information including first name, last name, and email.',
      },
      paths: {
        '/submit_personal_info': {
          post: {
            summary: 'Submits the complete personal information.',
            description: 'Only use this tool after you have collected the user\'s first name, last name, AND email address. You must provide all three values.',
            operationId: 'submitCompletedForm',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      firstName: {
                        type: 'string',
                        description: 'The user\'s collected first name.',
                      },
                      lastName: {
                        type: 'string',
                        description: 'The user\'s collected last name.',
                      },
                      email: {
                        type: 'string',
                        description: 'The user\'s collected email address.',
                      },
                    },
                    required: ['firstName', 'lastName', 'email'],
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'A confirmation that the personal information was submitted successfully.',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        submissionId: {
                          type: 'string',
                          description: 'A unique ID for the successful submission.',
                        },
                        message: {
                          type: 'string',
                          description: 'A confirmation message.',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    // Define the OpenAPI schema for the Vehicle Details action group
    const vehicleDetailsApiSchema = {
      openapi: '3.0.0',
      info: {
        title: 'Vehicle Details Submission API',
        version: '1.0.0',
        description: 'An API to submit vehicle details including make, model, and year.',
      },
      paths: {
        '/submit_vehicle_details': {
          post: {
            summary: 'Submits the complete vehicle details.',
            description: 'Only use this tool after you have collected the vehicle\'s make, model, AND year. You must provide all three values.',
            operationId: 'submitVehicleDetails',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      make: {
                        type: 'string',
                        description: 'The vehicle\'s make (e.g., Toyota, Ford, Honda).',
                      },
                      model: {
                        type: 'string',
                        description: 'The vehicle\'s model (e.g., Camry, F-150, Civic).',
                      },
                      year: {
                        type: 'string',
                        description: 'The vehicle\'s year (e.g., 2020, 2015).',
                      },
                    },
                    required: ['make', 'model', 'year'],
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'A confirmation that the vehicle details were submitted successfully.',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        submissionId: {
                          type: 'string',
                          description: 'A unique ID for the successful submission.',
                        },
                        message: {
                          type: 'string',
                          description: 'A confirmation message.',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    // Create the Bedrock agent with inline action groups
    this.agent = new bedrock.CfnAgent(this, 'MultiFormAgent', {
      agentName: `multi-form-agent-${stage}`,
      description: 'Bedrock agent for collecting personal information and vehicle details',
      foundationModel: foundationModel,
      agentResourceRoleArn: bedrockAgentRole.roleArn,
      idleSessionTtlInSeconds: idleSessionTimeout,
      instruction: `You are an assistant who can help users fill out two different forms: a Personal Information form and a Vehicle Details form.

Your first and most important step is to ask the user which form they would like to work on.

If the user wants the Personal Information form, follow these steps:
1. Collect the user's first name, last name, AND email address.
2. Ask for the information one piece at a time.
3. Once you have all three pieces of information, call the submitCompletedForm tool.

If the user wants the Vehicle Details form, follow these steps:
1. Collect the vehicle's make, model, AND year.
2. Ask for the information one piece at a time.
3. Once you have all three pieces of information, call the submitVehicleDetails tool.

Always be helpful and guide the user through the process step by step.`,
      tags: {
        Environment: stage,
        Project: 'BedrockAgent',
        ManagedBy: 'CDK',
      },
      // Define action groups inline here as an array
      actionGroups: [
        {
          actionGroupName: 'PersonalInfoActions',
          description: 'Action group for personal information submission operations',
          actionGroupExecutor: {
            lambda: this.personalInfoLambda.functionArn,
          },
          apiSchema: {
            payload: JSON.stringify(personalInfoApiSchema),
          },
        },
        {
          actionGroupName: 'VehicleDetailsActions',
          description: 'Action group for vehicle details submission operations',
          actionGroupExecutor: {
            lambda: this.vehicleDetailsLambda.functionArn,
          },
          apiSchema: {
            payload: JSON.stringify(vehicleDetailsApiSchema),
          },
        },
      ],
    });

    // Create agent alias for easier invocation
    const agentAlias = new bedrock.CfnAgentAlias(this, 'MultiFormAgentAlias', {
      agentId: this.agent.attrAgentId,
      agentAliasName: `multi-form-alias-${stage}`,
      description: `Alias for multi-form agent - ${stage} environment`,
    });

    // Add dependencies - The alias depends directly on the agent
    agentAlias.addDependency(this.agent);

    // Outputs
    new cdk.CfnOutput(this, 'BedrockAgentId', {
      value: this.agent.attrAgentId,
      description: 'Bedrock Agent ID',
      exportName: `bedrock-agent-id-${stage}`,
    });

    new cdk.CfnOutput(this, 'BedrockAgentArn', {
      value: this.agent.attrAgentArn,
      description: 'Bedrock Agent ARN',
      exportName: `bedrock-agent-arn-${stage}`,
    });

    new cdk.CfnOutput(this, 'BedrockAgentAliasId', {
      value: agentAlias.attrAgentAliasId,
      description: 'Bedrock Agent Alias ID',
      exportName: `bedrock-agent-alias-id-${stage}`,
    });

    new cdk.CfnOutput(this, 'PersonalInfoLambdaArn', {
      value: this.personalInfoLambda.functionArn,
      description: 'Personal Info Lambda Function ARN',
      exportName: `personal-info-lambda-arn-${stage}`,
    });

    new cdk.CfnOutput(this, 'VehicleDetailsLambdaArn', {
      value: this.vehicleDetailsLambda.functionArn,
      description: 'Vehicle Details Lambda Function ARN',
      exportName: `vehicle-details-lambda-arn-${stage}`,
    });

    new cdk.CfnOutput(this, 'BedrockAgentRoleArn', {
      value: bedrockAgentRole.roleArn,
      description: 'Bedrock Agent Execution Role ARN',
      exportName: `bedrock-agent-role-arn-${stage}`,
    });
  }
}
