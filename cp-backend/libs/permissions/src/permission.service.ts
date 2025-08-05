/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: PermissionService
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Injectable } from '@nestjs/common';
import data from './role-features.json';
import { ACTIONS, RESOURCES } from './features.constants';

@Injectable()
export class PermissionService {
  constructor() {}

  generatePermissionsByRole(role: string) {
    const roleData: {
      [resource in RESOURCES]: {
        [action in ACTIONS]?: {
          ROLES: string[];
        };
      };
    } = data;
    const featurePermissions = [];

    const keys = Object.keys(roleData);
    keys.map((key) => {
      const resource_permission: {
        [action in ACTIONS]?: {
          ROLES: string[];
        };
      } = roleData[key];
      const actions = Object.keys(resource_permission);
      const permission = [];
      actions.map((action: ACTIONS) => {
        if (resource_permission[action]?.ROLES.includes(role)) {
          permission.push(action);
        }
      });
      if (!!permission) {
        featurePermissions.push({
          feature: key,
          permissions: permission,
        });
      }
    });
    return featurePermissions;
  }
}
