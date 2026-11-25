import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'trainpro.auth.access-token';

type TokenStorageOperation = 'save' | 'read' | 'delete';

export class TokenStorageError extends Error {
  constructor(readonly operation: TokenStorageOperation) {
    super(`Secure token storage ${operation} failed.`);
    this.name = 'TokenStorageError';
  }
}

async function ensureSecureStoreAvailable(): Promise<void> {
  if (!(await SecureStore.isAvailableAsync())) {
    throw new Error('SecureStore is unavailable on this platform.');
  }
}

export const tokenStorage = {
  async save(token: string): Promise<void> {
    if (!token) {
      throw new TypeError('A non-empty session token is required.');
    }

    try {
      await ensureSecureStoreAvailable();
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch {
      throw new TokenStorageError('save');
    }
  },

  async get(): Promise<string | null> {
    try {
      await ensureSecureStoreAvailable();
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      throw new TokenStorageError('read');
    }
  },

  async delete(): Promise<void> {
    try {
      await ensureSecureStoreAvailable();
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      throw new TokenStorageError('delete');
    }
  },
};
