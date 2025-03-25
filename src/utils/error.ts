/** Extended Error interface for Messaging In-App and Web API errors */
export interface MessagingInAppWebError extends Error {
  statusCode: number;
  operation: string;
  type: string;
}

/**
 * Creates a standardized Messaging In-App and Web API error object.
 * @param {number} status - HTTP status code
 * @param {string} operation - Name of the operation that failed
 * @returns {MessagingInAppWebError} object with error details
 */
export function createError(
  status: number,
  operation: string
): MessagingInAppWebError {
  const error = new Error(`Error in ${operation}: ${status}`) as MessagingInAppWebError;
  error.statusCode = status;
  error.operation = operation;
  error.type = getErrorTypeFromStatus(status);

  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, createError);
  }
  return error;
}

/**
 * Determines the error type based on HTTP status code.
 * @param {number} status - HTTP status code
 * @returns {string} representing the error type
 */
function getErrorTypeFromStatus(status: number): string {
  if (status === 400) return 'invalid_request';
  if (status === 401) return 'authentication_error';
  if (status === 403) return 'permission_error';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate_limit_error';
  if (status === 500) return 'api_error';
  return 'unknown_error';
}
