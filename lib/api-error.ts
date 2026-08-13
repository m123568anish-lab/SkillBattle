/**
 * API Error Handler
 * Centralizes error handling for API requests
 */

import { AxiosError } from "axios";
import { ERROR_MESSAGES, HTTP_STATUS } from "./api-constants";

export interface APIError {
  status: number;
  message: string;
  details?: any;
  code?: string;
}

export class APIErrorHandler {
  static handle(error: any): APIError {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      return {
        status,
        message:
          data?.message || this.getMessageForStatus(status),
        details: data?.details,
        code: data?.code,
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        status: 0,
        message: ERROR_MESSAGES.NETWORK_ERROR,
        details: error.request,
      };
    } else {
      // Error in setting up request
      return {
        status: 0,
        message: error.message || ERROR_MESSAGES.SERVER_ERROR,
        details: error,
      };
    }
  }

  private static getMessageForStatus(
    status: number
  ): string {
    switch (status) {
      case HTTP_STATUS.UNAUTHORIZED:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case HTTP_STATUS.FORBIDDEN:
        return ERROR_MESSAGES.FORBIDDEN;
      case HTTP_STATUS.NOT_FOUND:
        return ERROR_MESSAGES.NOT_FOUND;
      case HTTP_STATUS.BAD_REQUEST:
        return ERROR_MESSAGES.INVALID_REQUEST;
      case HTTP_STATUS.CONFLICT:
        return ERROR_MESSAGES.CONFLICT;
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return ERROR_MESSAGES.SERVER_ERROR;
    }
  }

  static isUnauthorized(error: APIError): boolean {
    return error.status === HTTP_STATUS.UNAUTHORIZED;
  }

  static isForbidden(error: APIError): boolean {
    return error.status === HTTP_STATUS.FORBIDDEN;
  }

  static isNotFound(error: APIError): boolean {
    return error.status === HTTP_STATUS.NOT_FOUND;
  }

  static isServerError(error: APIError): boolean {
    return (
      error.status >= 500 || error.status === 0
    );
  }
}
