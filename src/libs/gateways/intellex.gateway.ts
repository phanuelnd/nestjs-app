import * as dotenv from 'dotenv';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import * as process from 'process';
dotenv.config();

export interface HttpRequestConfig {
  url: string;
  data?: object | string;
  params?: object;
  headers?: object;
  httpsAgentOptions?: object;
  auth?: any;
  method: 'post' | 'get | ';
}
export class IntellexGateway {
  constructor(private readonly axiosService: HttpService) {}

  async dispatchRequest<T>(
    requestConfig: HttpRequestConfig,
  ): Promise<T | undefined> {
    const config: HttpRequestConfig = {
      headers: {
        'api-key': process.env.INTELLEX_API_KEY,
        'Content-Type': 'application/json',
      },
      url: `${process.env.INTELLEX_API_URL}`,
      data: requestConfig.data,
      method: requestConfig.method,
    };

    Logger.log(`SEND REQUEST TO INTELLEX`, {
      params: config.params,
      data: config.data,
      method: config.method,
      url: config.url,
    });

    return new Promise((resolve, reject): void => {
      this.axiosService
        .request({
          headers: <any>config.headers,
          url: config.url,
          data: config.data,
          method: config.method,
          timeout: 60 * 1000,
        })
        .subscribe({
          next: (response) => {
            return resolve({ ...response.data, isErr: false });
          },
          error: (error) => {
            Logger.error(
              `${config.method} request on INTELLEX failed on ${config.url}`,
              {
                params: config.params,
                data: config.data,
                method: config.method,
                url: config.url,
                errorMessage:
                  error.response?.data?.message ??
                  error.response.message ??
                  error?.message,
                errorData: error.response?.data,
              },
            );
            const response = error.response?.data
              ? {
                  statusCode: +error.response.data.statusCode,
                  message: error.response.data.message,
                  error: error.response.data.error,
                }
              : {
                  statusCode: -1,
                  message: [error.message],
                  error: error.message,
                };
            reject({ ...response, isErr: true });
          },
        });
    });
  }

  async fetchNewPermits(startDate: string, endDate: string): Promise<any> {
    const url = '';
  }
}
