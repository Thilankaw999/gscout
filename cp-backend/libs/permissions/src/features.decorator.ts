/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: FeaturesGuard
 * Module: LiSLS Boilerplate
 */

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import rolesFeatures from './role-features.json';
import { CHECK_FEATURES_KEY } from './features.constants';
import { FeaturePermission } from './features.guard';
import { UserContextService } from '@app/user-context';
import { Logger } from '@app/logger';
import { LOCAL_DEV } from '@app/common';

@Injectable()
export class FeaturesGuard implements CanActivate {
  constructor(
    private readonly _logger: Logger,
    private reflector: Reflector,
    private readonly userContextService: UserContextService,
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

    const cognitoUsername = isLocalDevelopment
      ? LOCAL_DEV.COGNITO_USERNAME
      : request?.['event']?.requestContext?.authorizer?.claims?.[
      'email'
      ];

    const cognitoKey = isLocalDevelopment
      ? LOCAL_DEV.COGNITO_KEY
      : request?.event?.requestContext?.authorizer?.claims?.sub;

    const role ='ADMIN'
    this.userContextService.initialize({
      userId: 1,
      isStaff: true,
      role: role,
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      mobileNumber: '+1234567890',
      isActive: true,
      cognitoKey: cognitoKey,
      cognitoUsername: cognitoUsername,
      preferredName: 'John',
      pronoun: 'John',
      lastLoggedIn: new Date(),
      federatedProviderType: 'GOOGLE',
    });

    this._logger.debug('User role: ', { role });

    const ability = this.defineAbility(role);

    return requiredPermissions.every(([resource, action]) =>
      ability.can(action, resource),
    );
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
