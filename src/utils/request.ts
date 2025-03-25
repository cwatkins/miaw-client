import { createError } from './error.js';
import { Logger } from '../MessagingInAppWeb.js';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions {
    method: HttpMethod;
    headers?: Record<string, string>;
    body?: unknown;
    timeout?: number;
}

interface TimeoutError extends Error {
    type: string;
    operation: string;
}

/**
 * Makes an HTTP request with optional timeout
 * @param url URL to fetch
 * @param options Request options including timeout
 * @param logger Logger instance
 * @param operation Name of operation for error reporting
 * @returns Promise with response data
 */
export async function makeRequest<T>(
    url: string,
    options: RequestOptions,
    operation: string,
    logger: Logger = console
): Promise<T> {
    const { method, headers = {}, body, timeout } = options;
    const controller = new AbortController();
    const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;

    try {
        const fetchOptions: RequestInit = {
            method,
            headers,
            signal: controller.signal
        };

        if (body) {
            fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
            
            if (!headers['Content-Type'] && typeof body !== 'string') {
                fetchOptions.headers = {
                    ...headers,
                    'Content-Type': 'application/json'
                };
            }
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            throw createError(response.status, operation);
        }

        return response as T;
    } catch (error: unknown) {
        if (error instanceof Error && error.name === 'AbortError') {
            const timeoutError = new Error(`Request timeout for operation: ${operation}`) as TimeoutError;
            timeoutError.type = 'timeout_error';
            timeoutError.operation = operation;
            logger.error(`Request timeout for ${operation}`, timeoutError);
            throw timeoutError;
        }

        logger.error(`Error in ${operation}:`, error);
        throw error;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}