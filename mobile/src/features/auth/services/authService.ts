import { api } from '@/services/api';
import { normalizeEmail } from '@/features/auth/utils/normalizeEmail';

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    terms_accepted: boolean;
  };
};

export type AuthenticatedUser = LoginResponse['user'];

type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  terms_accepted: boolean;
};

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', {
    email: normalizeEmail(credentials.email),
    password: credentials.password,
  });

  return data;
}

export async function register(
  credentials: RegisterCredentials,
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/register', {
    first_name: credentials.first_name.trim(),
    last_name: credentials.last_name.trim(),
    email: normalizeEmail(credentials.email),
    password: credentials.password,
    terms_accepted: credentials.terms_accepted,
  });

  return data;
}

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  const { data } = await api.get<AuthenticatedUser>('/auth/me');
  return data;
}

export async function logout(): Promise<boolean> {
  const { status } = await api.post<void>('/auth/logout');
  return status === 204;
}
