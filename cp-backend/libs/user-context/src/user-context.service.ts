/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: UserContextService
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Injectable, Scope } from '@nestjs/common';
import { Logger } from '@app/logger';
import { USER_CONTEXT_IDENTIFIER, LOCAL_DEV, ROLE_KEYS } from '@app/common';

@Injectable({ scope: Scope.REQUEST })
export class UserContextService {
  private userId!: number;
  private email!: string;
  private firstName!: string;
  private lastName!: string;
  private role!: string;
  private isStaff!: boolean;
  private mobileNumber!: string;
  private cognitoKey!: string;
  private cognitoUsername!: string;
  private isActive!: number | boolean;
  private preferredName!: string;
  private pronoun!: string;
  private lastLoggedIn!: Date;
  private federatedProviderType!: string;

  private isInitialized = false;
  private readonly isLocalDevelopment = process.env.IS_OFFLINE === 'true' && process.env.STAGE === 'dev';

  constructor(private readonly logger: Logger) {}

  /**
   * Initializes the user context with the given values.
   * All properties must be set to avoid null or undefined values.
   */
  initialize(context?: IUserContext): void {
    // If in local development and no context provided, use mock data
    if (this.isLocalDevelopment && !context) {
      context = this.getMockUserContext();
    }

    if (!context) {
      throw new Error('UserContextService: No context provided');
    }

    this.userId = context.userId;
    this.email = context.email;
    this.firstName = context.firstName;
    this.lastName = context.lastName;
    this.role = context.role;
    this.isStaff = context.isStaff;
    this.mobileNumber = context.mobileNumber;
    this.cognitoKey = context.cognitoKey;
    this.cognitoUsername = context.cognitoUsername;
    this.isActive = context.isActive;
    this.preferredName = context.preferredName;
    this.pronoun = context.pronoun;
    this.lastLoggedIn = context.lastLoggedIn;
    this.federatedProviderType = context.federatedProviderType;
    
    this.logger.debug('UserContextService: Initialized with context', {
      context,
      isLocalDevelopment: this.isLocalDevelopment,
    });
    
    Reflect.defineMetadata(
      USER_CONTEXT_IDENTIFIER,
      { userId: context?.userId },
      global,
    );
    this.isInitialized = true;
  }

  /**
   * Provides mock user context for local development
   * @returns Mock user context based on local development settings
   */
  private getMockUserContext(): IUserContext {
    const mockClaims = {
      sub: LOCAL_DEV.COGNITO_KEY,
      email: 'twidanagamage@mitrai.com',
      'cognito:username': LOCAL_DEV.COGNITO_USERNAME,
      'cognito:groups': [ROLE_KEYS.ADMIN],
      given_name: 'Test',
      family_name: 'User',
    };

    return {
      userId: 1, // Default mock user ID
      email: mockClaims.email,
      firstName: mockClaims.given_name,
      lastName: mockClaims.family_name,
      role: mockClaims['cognito:groups']?.[0] || ROLE_KEYS.USER,
      isStaff: mockClaims['cognito:groups']?.[0] === ROLE_KEYS.ADMIN,
      mobileNumber: '', // Add if needed
      cognitoKey: mockClaims.sub,
      cognitoUsername: mockClaims['cognito:username'],
      isActive: true,
      preferredName: `${mockClaims.given_name} ${mockClaims.family_name}`.trim(),
      pronoun: '', // Optional
      lastLoggedIn: new Date(),
      federatedProviderType: 'LOCAL',
    };
  }

  /**
   * Ensures the service has been initialized.
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('UserContextService: Service is not initialized.');
    }
  }

  getUserId(): number {
    this.ensureInitialized();
    return this.userId;
  }

  getEmail(): string {
    this.ensureInitialized();
    return this.email;
  }

  getFirstName(): string {
    this.ensureInitialized();
    return this.firstName;
  }

  getLastName(): string {
    this.ensureInitialized();
    return this.lastName;
  }

  getRole(): string {
    this.ensureInitialized();
    return this.role;
  }

  getIsStaff(): boolean {
    this.ensureInitialized();
    return this.isStaff;
  }

  getMobileNumber(): string {
    this.ensureInitialized();
    return this.mobileNumber;
  }

  getCognitoKey(): string {
    this.ensureInitialized();
    return this.cognitoKey;
  }

  getCognitoUsername(): string {
    this.ensureInitialized();
    return this.cognitoUsername;
  }

  getIsActive(): number | boolean {
    this.ensureInitialized();
    return this.isActive;
  }

  getPreferredName(): string {
    this.ensureInitialized();
    return this.preferredName;
  }

  getPronoun(): string {
    this.ensureInitialized();
    return this.pronoun;
  }

  getLastLoggedIn(): Date {
    this.ensureInitialized();
    return this.lastLoggedIn;
  }

  getFederatedProviderType(): string {
    this.ensureInitialized();
    return this.federatedProviderType;
  }

  /**
   * Returns all user context data in a single object.
   */
  getUserContext(): IUserContext {
    this.ensureInitialized();
    return {
      userId: this.userId,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      isStaff: this.isStaff,
      mobileNumber: this.mobileNumber,
      cognitoKey: this.cognitoKey,
      cognitoUsername: this.cognitoUsername,
      isActive: this.isActive,
      preferredName: this.preferredName,
      pronoun: this.pronoun,
      lastLoggedIn: this.lastLoggedIn,
      federatedProviderType: this.federatedProviderType,
    };
  }

  /**
   * Clears all stored values and resets initialization state.
   */
  clear(): void {
    this.logger.debug('UserContextService: Cleared');
    this.isInitialized = false;
    Reflect.defineMetadata(USER_CONTEXT_IDENTIFIER, { userId: null }, global);
  }

  /**
   * Returns the full name of the user
   */
  getFullName(): string {
    this.ensureInitialized();
    // Combine first and last name, or use preferred name
    return this.preferredName || `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Convenience method to get user profile in new endpoint format
   */
  getUserProfile(): {
    name: string;
    email: string;
    phone: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  } {
    this.ensureInitialized();
    return {
      name: this.getFullName(),
      email: this.email,
      phone: this.mobileNumber,
      // Note: Address would typically come from a separate service
    };
  }
}

interface IUserContext {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isStaff: boolean;
  mobileNumber: string;
  cognitoKey: string;
  cognitoUsername: string;
  isActive: number | boolean;
  preferredName: string;
  pronoun: string;
  lastLoggedIn: Date;
  federatedProviderType: string;
}
