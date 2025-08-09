/**
 * Author: Assistant
 * Created on: 2024-12-21
 * Description: Cognito User Pool Construct
 * Module: Girl Scouts OCR POC Infrastructure
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { envSpecificParam, getEnvironment } from '../../utils';
import { webDomain } from '../../../environment/env.json';

interface CognitoAuthConfig {
  callbackUrls: string[];
  logoutUrls: string[];
}

export class CognitoAuthConstruct extends Construct {
  public readonly cognitoDomain: string;
  public readonly clientId: string;
  public readonly userPoolArn: string;
  public readonly userPoolId: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const env = getEnvironment(this.node);

    const cognitoAuthConfig: CognitoAuthConfig = {
      callbackUrls: [
        `https://${webDomain}`,
        `https://${webDomain}/auth/callback`,
        'https://oauth.pstmn.io/v1/callback', // Added Postman OAuth callback
        ...(env === 'dev' ? [
          'http://localhost:3000',
          'http://localhost:3000/auth/callback',
        ] : [])
      ],
      logoutUrls: [
        `https://${webDomain}`, 
        ...(env === 'dev' ? ['http://localhost:3000'] : [])
      ],
    };

    // Create the User Pool with enhanced security
    const userPool = new cognito.UserPool(this, 'GirlScoutsUserPool', {
      userPoolName: envSpecificParam(env, 'girl-scouts-ocr-user-pool'),
      selfSignUpEnabled: env !== 'prod', // Disable self-signup in production
      signInAliases: {
        email: true,
        username: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: false, mutable: true },
        familyName: { required: false, mutable: true },
      },
      customAttributes: {
        'company': new cognito.StringAttribute({ 
          minLen: 1, 
          maxLen: 256,
          mutable: true 
        }),
        'role': new cognito.StringAttribute({ 
          minLen: 1, 
          maxLen: 50,
          mutable: true 
        }),
      },
      mfa: env === 'prod' ? cognito.Mfa.REQUIRED : cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      passwordPolicy: {
        minLength: 12, // Increased minimum length
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true, // Require symbols for better security
        tempPasswordValidity: cdk.Duration.days(1), // Shorter temp password validity
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      deletionProtection: env === 'prod', // Enable deletion protection for production
      userVerification: {
        emailSubject: 'Verify your Girl Scouts OCR account',
        emailBody: 'Thank you for signing up to Girl Scouts OCR! Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      userInvitation: {
        emailSubject: 'Welcome to Girl Scouts OCR',
        emailBody: 'You have been invited to join Girl Scouts OCR. Username: {username} Temporary password: {####}',
      },
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Add Cognito Domain
    const cognitoDomain = userPool.addDomain('GirlScoutsCognitoDomain', {
      cognitoDomain: {
        domainPrefix: envSpecificParam(env, 'girl-scouts-ocr-auth'),
      },
    });

    // Set the cognito domain URL
    this.cognitoDomain = cognitoDomain.domainName;

    // Create the User Pool Client for Girl Scouts OCR with enhanced security
    const userPoolClient = new cognito.UserPoolClient(
      this,
      'GirlScoutsUserPoolClient',
      {
        userPoolClientName: envSpecificParam(env, 'girl-scouts-ocr-client'),
        userPool,
        authFlows: {
          userPassword: true,
          adminUserPassword: true,
          userSrp: true,
          custom: false, // Disable custom auth flow for security
        },
        oAuth: {
          flows: {
            authorizationCodeGrant: true,
            implicitCodeGrant: false, // Disable implicit grant for security
          },
          callbackUrls: cognitoAuthConfig.callbackUrls,
          logoutUrls: cognitoAuthConfig.logoutUrls,
          scopes: [
            cognito.OAuthScope.EMAIL,
            cognito.OAuthScope.OPENID,
            cognito.OAuthScope.PROFILE
          ],
        },
        supportedIdentityProviders: [
          cognito.UserPoolClientIdentityProvider.COGNITO,
        ],
        authSessionValidity: cdk.Duration.minutes(15),
        refreshTokenValidity: cdk.Duration.days(30),
        accessTokenValidity: cdk.Duration.hours(1),
        idTokenValidity: cdk.Duration.hours(1),
        generateSecret: false, // Required for public clients like React apps
        preventUserExistenceErrors: true, // Prevent user enumeration attacks
      },
    );

    // Output values
    this.clientId = userPoolClient.userPoolClientId;
    this.userPoolArn = userPool.userPoolArn;
    this.userPoolId = userPool.userPoolId;

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'CognitoDomainOutput', {
      key: envSpecificParam(env, 'GirlScoutsCognitoDomain', ''),
      exportName: envSpecificParam(env, 'GirlScoutsCognitoDomain', ''),
      value: this.cognitoDomain,
      description: 'Cognito domain for authentication',
    });

    new cdk.CfnOutput(this, 'UserClientIdOutput', {
      key: envSpecificParam(env, 'GirlScoutsClientId', ''),
      exportName: envSpecificParam(env, 'GirlScoutsClientId', ''),
      value: this.clientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'UserPoolArnOutput', {
      key: envSpecificParam(env, 'GirlScoutsUserPoolArn', ''),
      exportName: envSpecificParam(env, 'GirlScoutsUserPoolArn', ''),
      value: this.userPoolArn,
      description: 'Cognito User Pool ARN',
    });

    new cdk.CfnOutput(this, 'UserPoolIdOutput', {
      key: envSpecificParam(env, 'GirlScoutsUserPoolId', ''),
      exportName: envSpecificParam(env, 'GirlScoutsUserPoolId', ''),
      value: this.userPoolId,
      description: 'Cognito User Pool ID',
    });

    // 🚨 SECURITY WARNING: DO NOT output hardcoded credentials in CloudFormation!
    // These should be managed separately through AWS Secrets Manager or parameter store
    
    if (env === 'dev') {
      // Only for development - use proper secret management for other environments
      new cdk.CfnOutput(this, 'DevSetupInstructions', {
        key: envSpecificParam(env, 'GirlScoutsDevSetup', ''),
        exportName: envSpecificParam(env, 'GirlScoutsDevSetup', ''),
        value: 'Create users manually through AWS Console or CLI for security',
        description: 'Development setup instructions',
      });
    }
  }
}
