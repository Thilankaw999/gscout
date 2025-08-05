/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: Common constants for LiSLS Boilerplate
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

// Please use this only for local development to mock the user
export const LOCAL_DEV = {
  COGNITO_USERNAME: '591e64c8-d071-7051-810c-9f1b554f1d27',
  COGNITO_KEY: '591e64c8-d071-7051-810c-9f1b554f1d27',
};

export enum SORT_ORDER {
  ASC = 'ASC',
  DESC = 'DESC',
}
export const SYSTEM = 'system';

export const USER_CONTEXT_IDENTIFIER = 'UserSessionContext';

export enum ENV_STAGES {
  DEV = 'dev',
  QA = 'qa',
  UAT = 'uat',
  PROD = 'prod',
}

export enum ROLE_KEYS {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
export const USER_STATUS_KEY = {
  ACTIVE: {
    code: 'ACTIVE',
    displayName: 'Active',
  },
  INVITED: {
    code: 'INVITED',
    displayName: 'Invited',
  },
};

export enum TIME_ZONES {
  AU_BRISBANE = 'Australia/Brisbane',
}

export enum DATE_FORMATS {
  DEFAULT = 'YYYY-MM-DD',
  DDMMMYYYY = 'DD-MMM-YYYY',
  YYYYMMDDHHmmss = 'YYYYMMDDHHmmss',
}

export const HTTP_HEADERS = {
  JSON: { 'Content-Type': 'application/json' },
  TEXT: { 'Content-Type': 'text/plain' },
  HTML: { 'Content-Type': 'text/html' },
};
