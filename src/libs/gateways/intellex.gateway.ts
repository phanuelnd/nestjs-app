import * as dotenv from 'dotenv';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as process from 'process';
dotenv.config();

export interface HttpRequestConfig {
  url: string;
  data?: object | string;
  params?: object;
  headers?: object;
  httpsAgentOptions?: object;
  auth?: any;
  method: 'post' | 'get' | 'put';
}

@Injectable()
export class IntellexGateway {
  constructor(private readonly axiosService: HttpService) {}

  async dispatchRequest<T>(
    requestConfig: HttpRequestConfig,
  ): Promise<T | undefined> {
    const config: HttpRequestConfig = {
      headers: {
        'api-key': process.env.INTELLEX_API_KEY,
        'Content-Type': 'application/json',
        ...(requestConfig.headers || {}),
      },
      url: requestConfig.url,
      method: requestConfig.method,
      data: requestConfig.data,
      params: requestConfig.params,
    };

    Logger.log(`SEND REQUEST TO INTELLEX`, {
      method: config.method,
      url: config.url,
      params: config.params,
      data: config.data,
    });

    return new Promise((resolve, reject): void => {
      this.axiosService
        .request({
          url: config.url,
          method: config.method,
          headers: config.headers,
          data: config.data,
          params: config.params,
          timeout: 60 * 1000,
        })
        .subscribe({
          next: (response) => resolve(response.data),
          error: (error) => {
            Logger.error(
              `${config.method} request on INTELLEX failed on ${config.url}`,
              JSON.stringify({
                method: config.method,
                url: config.url,
                params: config.params,
                data: config.data,
                status: error.response?.status,
                statusText: error.response?.statusText,
                errorMessage:
                  error.response?.data?.message ??
                  error.response?.message ??
                  error?.message,
                errorData: error.response?.data,
              }),
            );
            
            // Create a consistent error structure
            const errorResponse = {
              statusCode: error.response?.status || -1,
              message: error.response?.data?.message || error.message || 'Unknown error',
              error: error.response?.data?.error || error.message || 'Request failed',
              originalError: error,
              isErr: true
            };
            
            reject(errorResponse);
          },
        });
    });
  }

  /**
   * Fetches permit ID by UPI from Intellex APIs.
   * @param upi - The UPI to search for.
   * @returns A promise that resolves to the permit ID or null if not found.
   * @throws BadRequestException if both APIs fail with errors (not just "not found").
   */
  async getPermitIdByUpi(upi: string): Promise<string | null> {
    if (!upi) {
      throw new BadRequestException('UPI is required');
    }

    // Try with the new API first
    const newApiUrl = `${process.env.INTELLEX_NEW_API_URL}`;
    try {
      const result = await this.dispatchRequest({
        method: 'get',
        data: {},
        url: newApiUrl,
        params: { upi },
      });
      
      if (result && typeof result === 'object' && 'id' in result && result.id) {
        const permitId = String(result.id).trim();
        if (permitId) {
          Logger.log(`Fetched permit ID from new API`, {
            upi,
            permitId: permitId,
          });
          return permitId;
        }
      }
      
      // If result exists but no permit_id, log it as "not found" rather than error
      Logger.log(`No permit ID found in new API response`, { upi, result });
      
    } catch (err: any) {
      const isNotFoundError = err.statusCode === 404 || 
                             err.statusCode === 204 || 
                             (err.statusCode >= 200 && err.statusCode < 300);
      
      if (isNotFoundError) {
        Logger.log(`Permit ID not found in new API (non-error response)`, { upi, statusCode: err.statusCode });
      } else {
        Logger.error(`New API error for UPI ${upi}`, {
          statusCode: err.statusCode,
          message: err.message,
          error: err.error
        });
      }
      
      // Continue to old API regardless of error type
    }

    // Try with the old API
    const oldApiUrl = `${process.env.INTELLEX_OLD_API_URL}`;
    try {
      const result = await this.dispatchRequest({
        method: 'get',
        data: {},
        url: oldApiUrl,
        params: { upi },
      });
      
      if (result && typeof result === 'object' && 'Permit_Number' in result && result.Permit_Number) {
        const permitId = String(result.Permit_Number).trim();
        if (permitId) {
          Logger.log(`Fetched permit ID from old API`, {
            upi,
            permitId: permitId,
          });
          return permitId;
        }
      }
      
      Logger.log(`No permit ID found in old API response`, { upi, result });
      
    } catch (err: any) {
      const isNotFoundError = err.statusCode === 404 || 
                             err.statusCode === 204 || 
                             (err.statusCode >= 200 && err.statusCode < 300);
      
      if (isNotFoundError) {
        Logger.log(`Permit ID not found in old API (non-error response)`, { upi, statusCode: err.statusCode });
      } else {
        Logger.error(`Old API error for UPI ${upi}`, {
          statusCode: err.statusCode,
          message: err.message,
          error: err.error
        });
      }
    }

    // If we get here, permit ID was not found in either API
    Logger.log(`Permit ID not found in either API`, { upi });
    return null; // Return null instead of throwing exception for "not found"
  }
}