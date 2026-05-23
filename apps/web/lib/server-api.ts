// Helper for Server Components and Route Handlers to call the NestJS API
// with the signed-in user's JWT (issued during the Auth.js sign-in flow).
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import { api } from './api';

export async function serverApi<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  return api<T>(path, { ...init, token });
}

export async function serverToken(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((session as any)?.accessToken as string | undefined) ?? null;
}
