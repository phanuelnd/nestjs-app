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

  // This method fetches new buildings from the RSA API (it will change when we will agree with RSA on how to query the data)
  /**
   * Fetches new buildings from the Intellex API within the specified date range.
   * @param startDate - The start date for fetching buildings in 'YYYY-MM-DD' format.
   * @param endDate - The end date for fetching buildings in 'YYYY-MM-DD' format.
   * @param location - The location to filter buildings (potentially).
   * @returns A promise that resolves to the fetched buildings data.
   * @throws BadRequestException if the request fails or returns an error.
   */
  async getPermitIdByUpi(upi: string): Promise<string | null> {
    // Try with the new API first
    const newApiUrl = `${process.env.INTELLEX_NEW_API_URL}/permit?upi=${upi}`;
    let result: any;
    try {
      result = await this.dispatchRequest({
        method: 'get',
        data: {},
        url: newApiUrl,
      });
      if (result && result.permit_id) {
        Logger.log(`Fetched permit ID from new API`, {
          upi,
          permitId: result.permit_id,
        });
        return result.permit_id;
      }
    } catch (err) {
      Logger.warn(`Failed to fetch permit ID from new API`, { upi, err });
    }

    // If not found, try with the old API
    const oldApiUrl = `${process.env.INTELLEX_OLD_API_URL}/permit?upi=${upi}`;
    try {
      result = await this.dispatchRequest({
        method: 'get',
        data: {},
        url: oldApiUrl,
      });
      if (result && result.permit_id) {
        Logger.log(`Fetched permit ID from old API`, {
          upi,
          permitId: result.permit_id,
        });
        return result.permit_id;
      }
    } catch (err) {
      Logger.error(`Failed to fetch permit ID from old API`, { upi, err });
    }

    Logger.error(`An error occurred during fetching permit ID from both APIs`, {
      upi,
    });
    throw new BadRequestException(`Fetching permit ID failed for UPI: ${upi}`);
  }



  // async fetchBuildings(startDate: string, endDate: string): Promise<any> {
  //   const url = `${process.env.INTELLEX_NEW_API_URL}?startDate=${startDate}&endDate=${endDate}`;
  //   const result: any = await this.dispatchRequest({
  //     method: 'get',
  //     data: {},
  //     url,
  //   });
  //   if (!result) {
  //     Logger.error(`An error occurred during fetching new permits`, {
  //       startDate,
  //       endDate,
  //       err: result,
  //     });
  //     throw new BadRequestException(`Fetching new permit failed ${result} `);
  //   }
  //   //Log the result for debugging
  //   Logger.log(`Fetched new permits`, {
  //     startDate,
  //     endDate,
  //     count: result.length,
  //   });
    
  //   return result;
  // }


}
