import axios from 'axios';

import {
  tokenStorage,
  TokenStorageError,
} from '@/services/storage/tokenStorage';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!configuredBaseUrl) {
  throw new Error(
    'EXPO_PUBLIC_API_URL is not configured. Set it in mobile/.env.local.',
  );
}

export const api = axios.create({
  baseURL: configuredBaseUrl.replace(/\/+$/, ''),
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

const AUTH_INTERCEPTOR_ID = '__trainproAuthRequestInterceptorId' as const;
type ApiWithAuthInterceptor = typeof api & {
  [AUTH_INTERCEPTOR_ID]?: number;
};

const apiWithAuthInterceptor = api as ApiWithAuthInterceptor;
const previousInterceptorId = apiWithAuthInterceptor[AUTH_INTERCEPTOR_ID];

if (previousInterceptorId !== undefined) {
  api.interceptors.request.eject(previousInterceptorId);
}

apiWithAuthInterceptor[AUTH_INTERCEPTOR_ID] = api.interceptors.request.use(
  async (config) => {
    let token: string | null;

    try {
      token = await tokenStorage.get();
    } catch (error) {
      if (error instanceof TokenStorageError) {
        throw error;
      }

      throw new TokenStorageError('read');
    }

    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.delete('Authorization');
    }

    return config;
  },
);
