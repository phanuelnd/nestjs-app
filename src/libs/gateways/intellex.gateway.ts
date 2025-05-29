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
      },
      url: requestConfig.url,
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
            return resolve(response.data);
          },
          error: (error) => {
            Logger.error(
              `${config.method} request on INTELLEX failed on ${config.url}`,
              JSON.stringify({
                params: config.params,
                data: config.data,
                method: config.method,
                url: config.url,
                errorMessage:
                  error.response?.data?.message ??
                  error.response?.message ??
                  error?.message,
                errorData: error.response?.data,
              }),
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
    const url = `${process.env.INTELLEX_NEW_API_URL}?startDate=${startDate}&endDate=${endDate}`;
    const result: any = await this.dispatchRequest({
      method: 'get',
      data: {},
      url,
    });
    if (!result) {
      Logger.error(`An error occurred during fetching new permits`, {
        startDate,
        endDate,
        err: result,
      });
      throw new BadRequestException(`Fetching new permit failed ${result} `);
    }
    //Log the result for debugging
    Logger.log(`Fetched new permits`, {
      startDate,
      endDate,
      count: result.length,
    });
    
    return result;
  }

  async fetchOldPermits(startDate: string, endDate: string): Promise<any> {
    const url = `${process.env.INTELLEX_OLD_API_URL}?startDate=${startDate}&endDate=${endDate}`;
    const result = await this.dispatchRequest({
      method: 'get',
      data: {},
      url,
    });
    if (!result) {
      Logger.error(`An error occurred during fetching old permits`, {
        startDate,
        endDate,
        err: result,
      });
      throw new BadRequestException(`Fetching old permit failed ${result} `);
    }
    return result;
  }
}
