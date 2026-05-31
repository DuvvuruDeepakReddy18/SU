'use client';

// Client wrapper so the Server Component dashboard page can mount the 3D
// avatar without violating Next 14's rule against `ssr:false` dynamic
// imports inside Server Components.

import dynamic from 'next/dynamic';

const DashboardAvatar3D = dynamic(
  () => import('./dashboard-avatar-3d').then((m) => m.DashboardAvatar3D),
  {
    ssr: false,
    loading: () => <div className="h-[360px] rounded-2xl bg-secondary/40 animate-pulse" />,
  },
);

export function DashboardAvatarWrapper({ studentName }: { studentName?: string }) {
  return <DashboardAvatar3D studentName={studentName} />;
}
