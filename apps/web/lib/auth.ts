import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { API_BASE } from './api';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        if (!creds?.email || !creds.password) return null;
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: creds.email, password: creds.password }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as {
          accessToken: string;
          user: { id: string; email: string; role: string };
        };
        return {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          accessToken: data.accessToken,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, sync the user with the NestJS API which enforces
      // the institution-domain rule and issues our JWT.
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          const res = await fetch(`${API_BASE}/auth/oauth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              fullName: user.name ?? user.email?.split('@')[0] ?? 'Student',
              provider: account.provider,
              providerUserId: account.providerAccountId,
              avatarUrl: user.image,
            }),
          });
          if (!res.ok) return false;
          const data = (await res.json()) as {
            accessToken: string;
            user: { id: string; role: string };
          };
          // Stash the API JWT on the user object so the jwt callback can persist it.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (user as any).accessToken = data.accessToken;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (user as any).id = data.user.id;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (user as any).role = data.user.role;
          return true;
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.accessToken = (user as any).accessToken;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.userId = (user as any).id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).accessToken = token.accessToken;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).userId = token.userId;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).role = token.role;
      return session;
    },
  },
};
