/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: FeaturesGuard
 * Module: LiSLS Boilerplate
 */

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Scope } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import rolesFeatures from './role-features.json';
import { CHECK_FEATURES_KEY } from './features.constants';
import { FeaturePermission } from './features.guard';
import { UserContextService } from '@app/user-context';
import { Logger } from '@app/logger';
import { LOCAL_DEV } from '@app/common';
import { UserRepository } from '@app/db';

@Injectable({ scope: Scope.REQUEST })
export class FeaturesGuard implements CanActivate {
  constructor(
    private readonly _logger: Logger,
    private reflector: Reflector,
    private readonly userContextService: UserContextService,
    private readonly userRepository: UserRepository,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<FeaturePermission[]>(
      CHECK_FEATURES_KEY,
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const isLocalDevelopment =
      process.env.IS_OFFLINE === 'true' && process.env.STAGE === 'dev';

    const request = context.switchToHttp().getRequest();

    // 🔐 Extract JWT claims properly
    const claims = isLocalDevelopment
      ? this.getMockClaims() // For local development
      : request?.event?.requestContext?.authorizer?.claims; // From API Gateway

    if (!claims) {
      this._logger.error('No JWT claims found in request');
      throw new UnauthorizedException('Authentication required');
    }

    // 📧 Extract user info from JWT claims
    const userEmail = claims.email;
    const cognitoSub = claims.sub;
    const cognitoUsername = claims['cognito:username'] || claims.email;
    const userRole = claims['cognito:groups']?.[0] || 'USER';
    const firstName = claims.given_name || claims.first_name || '';
    const lastName = claims.family_name || claims.last_name || '';

    if (!userEmail) {
      this._logger.error('No email found in JWT claims');
      throw new UnauthorizedException('Invalid token: missing email');
    }

    this._logger.debug('JWT Claims extracted', {
      userEmail,
      userRole,
      cognitoSub: cognitoSub ? '***' : undefined,
    });

    // 🔍 Find user by email in database
    const user = await this.userRepository.findByEmail(userEmail);
    
    if (!user) {
      this._logger.error('User not found in database', { userEmail });
      throw new UnauthorizedException(`User with email ${userEmail} not found`);
    }

    if (user.deletedAt) {
      this._logger.error('User account is deactivated', { userEmail, userId: user.id });
      throw new UnauthorizedException('User account is deactivated');
    }

    this._logger.debug('User found and verified', {
      userId: user.id,
      userEmail: user.email,
      userRole,
    });

    // 🎯 Initialize user context with real data from JWT + Database
    this.userContextService.initialize({
      userId: user.id,
      email: user.email,
      firstName: user.name ? user.name.split(' ')[0] : '',
      lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
      role: userRole,
      isStaff: userRole === 'ADMIN' || userRole === 'STAFF',
      mobileNumber: user.phone || '',
      cognitoKey: cognitoSub,
      cognitoUsername: cognitoUsername,
      isActive: true, // User is active if not deleted
      preferredName: user.name || '',
      pronoun: '', // Optional, can be added later if needed
      lastLoggedIn: new Date(),
      federatedProviderType: 'COGNITO',
    });

    this._logger.debug('User context initialized', {
      userId: user.id,
      userEmail: user.email,
      userRole,
    });

    const ability = this.defineAbility(userRole);

    return requiredPermissions.every(([resource, action]) =>
      ability.can(action, resource),
    );
  }

  /**
   * 🧪 Mock claims for local development
   */
  private getMockClaims() {
    return {
      sub: LOCAL_DEV.COGNITO_KEY,
      email: 'twidanagamage@mitrai.com',
      'cognito:username': 'twidanagamage@mitrai.com',
      'cognito:groups': ['ADMIN'],
      given_name: 'Thi',
      family_name: 'la',
    };
  }

  private defineAbility(userRole: string) {
    const { can, build } = new AbilityBuilder(createMongoAbility);

    Object.keys(rolesFeatures).forEach((resource) => {
      const actions = rolesFeatures[resource];
      Object.keys(actions).forEach((action) => {
        const roles = actions[action].ROLES;
        if (roles?.includes(userRole)) {
          can(action, resource);
        }
      });
    });

    return build();
  }
}
