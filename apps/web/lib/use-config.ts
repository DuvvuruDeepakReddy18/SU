'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type FeatureFlags = {
  storage: boolean;
  ai: boolean;
  github: boolean;
  google: boolean;
  razorpay: boolean;
  digiLocker: boolean;
  expertScreen: boolean;
};

const DEFAULTS: FeatureFlags = {
  storage: false,
  ai: false,
  github: false,
  google: false,
  razorpay: false,
  digiLocker: false,
  expertScreen: false,
};

export function useConfig(): FeatureFlags {
  const { data } = useQuery({
    queryKey: ['config'],
    queryFn: () => api<FeatureFlags>('/config'),
    staleTime: 5 * 60_000,
  });
  return { ...DEFAULTS, ...(data ?? {}) };
}
