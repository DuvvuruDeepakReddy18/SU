'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type VerificationStatus = {
  overall: 'verified' | 'partial' | 'unverified';
  fields: {
    collegeId: 'verified' | 'pending' | 'rejected' | 'unverified';
    cgpa: 'verified' | 'unverified';
    academicRecords: { verified: number };
    skills: { verified: number; total: number };
  };
};

export function useVerificationStatus() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;

  return useQuery({
    enabled: !!token,
    queryKey: ['verifications.status'],
    queryFn: () => api<VerificationStatus>('/verifications/me/status', { token }),
    staleTime: 30_000,
  });
}
