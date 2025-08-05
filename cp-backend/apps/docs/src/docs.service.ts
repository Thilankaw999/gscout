/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: DocsApiService
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class DocsApiService {
  private baseUrl = `https://${process.env.slsApiDomain}`;
  private swaggerUrls: string[];
  private cognitoDomain = process.env.userPoolDomain;
  private cognitoClientId = process.env.userPoolClientId;
  private cognitoRedirectUri = `${this.baseUrl}/docs/`;
  private loginUrl = `https://${this.cognitoDomain}/login`;
  private tokenUrl = `https://${this.cognitoDomain}/oauth2/token`;

  constructor() {
    this.swaggerUrls = this.determineSwaggerUrls();
  }

  async getAggregatedSwaggerJson(): Promise<object> {
    const swaggerDocuments = await Promise.all(
      this.swaggerUrls.map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch Swagger document from ${url}`);
        }
        return response.json();
      }),
    );

    const mergedSwagger = swaggerDocuments.reduce((acc, doc) => {
      // Ensure paths are always relative
      Object.keys(doc.paths).forEach((path) => {
        acc.paths[path] = doc.paths[path]; // Keep paths relative, e.g., "/invoice"
      });

      acc.components.schemas = {
        ...acc.components.schemas,
        ...doc.components.schemas,
      };

      // Ensure security is applied to each endpoint if not already present
      Object.keys(doc.paths).forEach((path) => {
        Object.keys(doc.paths[path]).forEach((method) => {
          if (!doc.paths[path][method].security) {
            doc.paths[path][method].security = [{ bearerAuth: [] }];
          }
        });
      });

      return acc;
    }, this.createBaseDocument());

    return mergedSwagger;
  }

  getSwaggerDocumentHTML(): string {
    const isOffline = process.env.IS_OFFLINE === 'true';

    const swaggerUiHtml: string = `
      <!DOCTYPE html>
      <html lang="en">
        <head> 
          <meta charset="UTF-8">
          <title>Swagger UI</title>
          <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3/swagger-ui.css">
          <style>
            /* Hide the SmartBear sponsored search bar */
            .topbar {
              display: none;
            }
          </style>
        </head>
        <body>
          <div id="swagger-ui"></div>
          <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
          <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js"></script>
          <script type="text/javascript">
            window.onload = function() {
              const ui = SwaggerUIBundle({
                deepLinking: true,
                dom_id: '#swagger-ui',
                showExtensions: true,
                showCommonExtensions: true,
                url: '/docs/swagger.json',

                ${
                  isOffline
                    ? ''
                    : `
                // Enable OAuth 2.0 for AWS Cognito
                oauth2RedirectUrl: '${this.cognitoRedirectUri}',

                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],

                layout: "StandaloneLayout",

                // Configure OAuth 2.0 for AWS Cognito
                oauth: {
                  clientId: '${this.cognitoClientId}',
                  authorizationUrl: '${this.loginUrl}',
                  tokenUrl: '${this.tokenUrl}',
                  scopes: {
                    'openid': 'OpenID Connect scope',
                    'profile': 'User profile',
                    'email': 'User email',
                    'phone': 'User phone number'
                  }
                },
                requestInterceptor: function(request) {
                  // Attach the ID token to each request
                  const idToken = sessionStorage.getItem('id_token');
                  if (idToken) {
                    request.headers['Authorization'] = 'Bearer ' + idToken;
                  }
                  return request;
                }
                `
                }

              });

              ${
                isOffline
                  ? ''
                  : `
              // Initialize OAuth with Cognito
              ui.initOAuth({
                clientId: '${this.cognitoClientId}',
                appName: 'Swagger UI',
                scopes: 'phone email profile openid',
                scopeSeparator: ' ',
                useBasicAuthenticationWithAccessCodeGrant: false
              });
              `
              }

             // Directly handle the OAuth2 redirect by processing the URL
              (function() {
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');

                if (code) {
                  // Exchange the code for tokens
                  fetch('https://${this.cognitoDomain}/oauth2/token', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                      grant_type: 'authorization_code',
                      client_id: '${this.cognitoClientId}',
                      code: code,
                      redirect_uri: '${this.cognitoRedirectUri}'
                    })
                  })
                  .then(response => response.json())
                  .then(data => {
                    if (data.id_token) {
                      // Store the ID token in session storage (or any other secure place)
                      sessionStorage.setItem('id_token', data.id_token);

                      // Optionally, you can use the token for Swagger UI requests
                      ui.preauthorizeApiKey('bearerAuth', 'Bearer ' + data.id_token);

                      // Remove the code parameter from the URL
                      window.history.replaceState({}, document.title, window.location.pathname);
                    } else {
                      console.error('Token exchange failed:', data);
                    }
                  })
                  .catch(error => {
                    console.error('Error exchanging token:', error);
                  });
                }
              })();
            };
          </script>
        </body>
      </html>
    `;

    return swaggerUiHtml;
  }

  private createBaseDocument(): object {
    const isOffline = process.env.IS_OFFLINE === 'true';

    // Base document structure
    const baseDocument = {
      openapi: '3.0.0',
      info: {
        title: 'SLS API',
        description: 'SLS API documentation for all services',
        version: '1.0',
      },
      paths: {},
      components: {
        securitySchemes: {
          oauth2: {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: this.loginUrl,
                tokenUrl: this.tokenUrl,
                clientId: this.cognitoClientId,
                scopes: {
                  openid: 'OpenID Connect scope',
                  profile: 'User profile',
                  email: 'User email',
                  phone: 'User phone number',
                },
              },
            },
          },
        },
      },
      security: [
        {
          bearerAuth: [],
          api_key: [],
        },
      ],
    };

    // If running locally, add the relevant 'servers' configuration for local APIs
    if (isOffline) {
      baseDocument['servers'] = [
        {
          url: 'http://localhost:3000', // URL for Invoice API
          description: 'Local Invoice API',
        },
        {
          url: 'http://localhost:3001', // URL for User API
          description: 'Local User API',
        },
        {
          url: 'http://localhost:3002', // URL for Payment API
          description: 'Local Payment API',
        },
        {
          url: 'http://localhost:3003', // URL for Client API
          description: 'Local Client API',
        },
        {
          url: 'http://localhost:3004', // URL for Account API
          description: 'Local Account API',
        },
      ];
    } else {
      // When deployed, use the base URL
      baseDocument['servers'] = [
        {
          url: this.baseUrl,
          description: 'Deployed SLS API',
        },
      ];
    }

    return baseDocument;
  }

  /**
   * Determines the correct Swagger URLs based on the environment.
   * Uses specific ports for local URLs with serverless-offline and a common base URL when deployed to AWS.
   */
  private determineSwaggerUrls(): string[] {
    const pathAndPorts = {
      invoice: 3000,
      user: 3001,
      payment: 3002,
      client: 3003,
      account: 3004,
    };
    if (process.env.IS_OFFLINE) {
      return Object.entries(pathAndPorts).map(
        ([path, port]) => `http://localhost:${port}/${path}/docs/swagger.json`,
      );
    } else {
      // Deployed to AWS

      return Object.entries(pathAndPorts).map(
        ([path]) => `${this.baseUrl}/${path}/docs/swagger.json`,
      );
    }
  }
}
