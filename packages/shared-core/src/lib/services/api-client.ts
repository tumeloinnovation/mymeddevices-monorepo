/**
 * Compatibility layer: Re-export the single canonical apiClient and related utilities.
 * Ensures backward compatibility while preventing duplicate TokenManagers and racing refresh requests.
 */

export {
  apiClient,
  healthCheck,
  getApiUrl,
  AuthExpiredError,
  isAuthExpiredError,
} from '../../services/api-client';

export type {
  ApiClientConfig,
  ApiErrorResponse,
  ApiSuccessResponse,
  ApiResponse,
} from '../../services/api-client';
