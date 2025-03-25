import type { Logger } from '../MessagingInAppWeb.js';
import { makeRequest } from '../utils/request.js';

/** Parameters for creating a new token */
export interface TokenCreateParams {
  capabilitiesVersion?: string;
  platform?: 'Web' | 'Mobile';
  deviceId?: string;
  context?: {
    appName: string;
    clientVersion: string;
  };
  authorizationType?: string;
  customerIdentityToken?: string;
}

/** Response structure for token operations */
export interface TokenResponse {
  accessToken: string;
  lastEventId: string;
}

/**
 * Service class for managing authentication tokens with the Messaging In-App and Web API.
 * Handles token creation, refresh, and management.
 */
export class TokenService {
  constructor(
    private baseUrl: string,
    private orgId: string,
    private developerName: string,
    private logger: Logger
  ) {}

  /**
   * Creates a new authentication token.
   * @param {TokenCreateParams} params - Token creation parameters
   * @returns {Promise<TokenResponse>} Promise containing the created token details
   */
  async create(params?: TokenCreateParams): Promise<TokenResponse> {
    const tokenType = this.isAuthenticatedTokenConfig(params) ? 'authenticated' : 'unauthenticated';

    this.logger.debug(`Creating ${tokenType} token`);

    const response = await makeRequest<Response>(
      `${this.baseUrl}/iamessage/api/v2/authorization/${tokenType}/access-token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          orgId: this.orgId,
          esDeveloperName: this.developerName,
          capabilitiesVersion: params?.capabilitiesVersion || '1',
          platform: params?.platform || 'Web',
          context: params?.context || {
            appName: 'MessagingInAppWebClient',
            clientVersion: '1.0.0',
          },
          ...(params?.deviceId && { deviceId: params?.deviceId }),
          ...(params?.authorizationType && { authorizationType: params.authorizationType }),
          ...(params?.customerIdentityToken && {
            customerIdentityToken: params.customerIdentityToken,
          }),
        },
      },
      `tokens.create_${tokenType}_token`,
      this.logger
    );

    const responseData = await response.json() as TokenResponse;
    this.logger.info('Token created successfully');
    return responseData;
  }

  /**
   * Refreshes an existing authentication token.
   * @param {string} token - Current authentication token
   * @returns {Promise<TokenResponse>} Promise containing the refreshed token details
   */
  async continue(token: string): Promise<TokenResponse> {
    this.logger.debug('Refreshing token');

    const response = await makeRequest<Response>(
      `${this.baseUrl}/iamessage/api/v2/authorization/continuation-access-token`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      },
      'tokens.refresh_token',
      this.logger
    );

    const responseData = await response.json() as TokenResponse;
    this.logger.info('Token refreshed successfully');
    return responseData;
  }

  /**
   * Determines if the token configuration is for authenticated users.
   * @param {TokenCreateParams} params - Token creation parameters
   * @returns {boolean} indicating if the configuration is for authenticated users
   */
  private isAuthenticatedTokenConfig(params?: TokenCreateParams): boolean {
    if (!params) {
      return false;
    }
    return (
      typeof params === 'object' &&
      params !== null &&
      'authorizationType' in params &&
      typeof params.authorizationType === 'string' &&
      'customerIdentityToken' in params &&
      typeof params.customerIdentityToken === 'string'
    );
  }
}
