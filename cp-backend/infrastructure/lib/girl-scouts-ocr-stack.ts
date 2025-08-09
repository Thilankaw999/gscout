/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Girl Scouts OCR Infrastructure Stack
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface GirlScoutsOcrStackProps extends cdk.StackProps {
  stage: string;
  region: string;
}

export class GirlScoutsOcrStack extends cdk.Stack {
  public readonly tfrDocumentsBucket: s3.Bucket;
  public readonly processingEventBus: events.EventBus;
  public readonly textractRole: iam.Role;
  public readonly ocrProcessingStateMachine: stepfunctions.StateMachine;

  constructor(scope: Construct, id: string, props: GirlScoutsOcrStackProps) {
    super(scope, id, props);

    const { stage, region } = props;

    // S3 bucket for TFR documents
    this.tfrDocumentsBucket = new s3.Bucket(this, 'TfrDocumentsBucket', {
      bucketName: `girl-scouts-tfr-documents-${stage}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'], // Restrict this in production
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // EventBridge event bus for processing coordination
    this.processingEventBus = new events.EventBus(this, 'ProcessingEventBus', {
      eventBusName: `girl-scouts-processing-${stage}`,
    });

    // SNS topic for processing notifications
    const processingNotificationTopic = new sns.Topic(this, 'ProcessingNotificationTopic', {
      topicName: `girl-scouts-processing-notifications-${stage}`,
      displayName: 'Girl Scouts OCR Processing Notifications',
    });

    // IAM role for Textract
    this.textractRole = new iam.Role(this, 'TextractRole', {
      roleName: `GirlScoutsTextractRole-${stage}`,
      assumedBy: new iam.ServicePrincipal('textract.amazonaws.com'),
      inlinePolicies: {
        TextractPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
              ],
              resources: [
                this.tfrDocumentsBucket.arnForObjects('*'),
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sns:Publish',
              ],
              resources: [
                processingNotificationTopic.topicArn,
              ],
            }),
          ],
        }),
      },
    });

    // Step Functions state machine for OCR processing workflow
    this.ocrProcessingStateMachine = this.createOcrWorkflow(stage, processingNotificationTopic);

    // CloudWatch log group for processing logs
    new cdk.aws_logs.LogGroup(this, 'ProcessingLogGroup', {
      logGroupName: `/aws/girlscouts/ocr-processing/${stage}`,
      retention: cdk.aws_logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Output important values
    new cdk.CfnOutput(this, 'TfrDocumentsBucketName', {
      value: this.tfrDocumentsBucket.bucketName,
      exportName: `GirlScouts-TfrDocumentsBucket-${stage}`,
    });

    new cdk.CfnOutput(this, 'ProcessingEventBusName', {
      value: this.processingEventBus.eventBusName,
      exportName: `GirlScouts-ProcessingEventBus-${stage}`,
    });

    new cdk.CfnOutput(this, 'TextractRoleArn', {
      value: this.textractRole.roleArn,
      exportName: `GirlScouts-TextractRole-${stage}`,
    });

    new cdk.CfnOutput(this, 'OcrProcessingStateMachineArn', {
      value: this.ocrProcessingStateMachine.stateMachineArn,
      exportName: `GirlScouts-OcrProcessingStateMachine-${stage}`,
    });
  }

  private createOcrWorkflow(stage: string, notificationTopic: sns.Topic): stepfunctions.StateMachine {
    // Define the OCR processing workflow
    const startProcessing = new stepfunctions.Pass(this, 'StartProcessing', {
      result: stepfunctions.Result.fromObject({
        status: 'processing',
        timestamp: stepfunctions.JsonPath.stringAt('$$.State.EnteredTime'),
      }),
    });

    const extractTfrData = new stepfunctions.Pass(this, 'ExtractTfrData', {
      comment: 'Placeholder for TFR data extraction - will be replaced with Lambda invocation',
      result: stepfunctions.Result.fromObject({
        status: 'ocr_completed',
        confidence: 95.5,
      }),
    });

    const validateData = new stepfunctions.Pass(this, 'ValidateData', {
      comment: 'Placeholder for data validation - will be replaced with Lambda invocation',
      result: stepfunctions.Result.fromObject({
        status: 'validation_completed',
        isValid: true,
      }),
    });

    const notifyCompletion = new stepfunctionsTasks.SnsPublish(this, 'NotifyCompletion', {
      topic: notificationTopic,
      message: stepfunctions.TaskInput.fromObject({
        documentId: stepfunctions.JsonPath.stringAt('$.documentId'),
        status: stepfunctions.JsonPath.stringAt('$.status'),
        processingTime: stepfunctions.JsonPath.stringAt('$$.State.EnteredTime'),
      }),
    });

    const handleError = new stepfunctionsTasks.SnsPublish(this, 'HandleError', {
      topic: notificationTopic,
      message: stepfunctions.TaskInput.fromObject({
        documentId: stepfunctions.JsonPath.stringAt('$.documentId'),
        status: 'failed',
        error: stepfunctions.JsonPath.stringAt('$.Error'),
        cause: stepfunctions.JsonPath.stringAt('$.Cause'),
      }),
    });

    // Define the workflow
    const definition = startProcessing
      .next(extractTfrData)
      .next(validateData)
      .next(notifyCompletion);

    return new stepfunctions.StateMachine(this, 'OcrProcessingStateMachine', {
      stateMachineName: `girl-scouts-ocr-processing-${stage}`,
      definition,
      timeout: cdk.Duration.minutes(30),
      tracingEnabled: true,
      logs: {
        destination: new cdk.aws_logs.LogGroup(this, 'StateMachineLogGroup', {
          logGroupName: `/aws/stepfunctions/girl-scouts-ocr-${stage}`,
          retention: cdk.aws_logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        level: stepfunctions.LogLevel.ALL,
      },
    });
  }
}
