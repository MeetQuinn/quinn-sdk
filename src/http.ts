import axios, { AxiosInstance } from 'axios';

import type { QuinnApiContract } from './config';

export interface QuinnHttpConfig {
  apiUrl: string;
  token: string;
  orgId: string;
  contract?: QuinnApiContract;
}

/** The value of the `x-lp-client` header: the Quinn API counts its callers by it. */
export const QUINN_SDK_CLIENT_NAME = 'quinn-sdk';

export function createQuinnHttpClient(config: QuinnHttpConfig): AxiosInstance {
  return axios.create({
    baseURL: `${config.apiUrl}/platform/v1/orgs/${config.orgId}`,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      'x-lp-client': QUINN_SDK_CLIENT_NAME,
      ...(config.contract === 2 || config.contract === 3
        ? { 'x-lp-contract': String(config.contract) }
        : {}),
    },
  });
}
