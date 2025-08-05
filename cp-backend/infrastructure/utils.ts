/**
 * Author: Thushara Fernando (thushara.fernando@mitrai.com)
 * Created on: 03-09-24
 * Description:
 * Module: MitraAi SLS Boilerplate Infra Utils
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

export const VALID_ENV_PARAMS = {
  DEV: 'dev',
  QA: 'qa',
  PROD: 'prod',
  UAT: 'uat',
};

export const getEnvironment = (node: any) => {
  if (!node) {
    return VALID_ENV_PARAMS.DEV;
  }
  const env = node.tryGetContext('stage');
  return [...Object.values(VALID_ENV_PARAMS)].includes(env)
    ? env
    : VALID_ENV_PARAMS.DEV;
};

export const envSpecificParam = (env: string, param: string, seperator: string = '-') =>
  `${param}${seperator}${env}`;

export function toCamelCase(str: string) {
  return str
    .toLowerCase()
    .split('-')
    .map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}