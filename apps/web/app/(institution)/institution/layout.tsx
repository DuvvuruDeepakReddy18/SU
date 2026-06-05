import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { InstitutionShell } from '@/components/institution/institution-shell';

/**
 * Institution / TPO portal layout. Server-side guards:
 *  - no session → /login
 *  - not an institution admin → bounce to the student dashboard
 *
 * Approval-status branching (pending / rejected / approved) happens client-side
 * in <InstitutionShell>, which reads /institution-admin/me.
 */
export default async function InstitutionLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const role = session?.role as string | undefined;
  if (role !== 'INSTITUTION_ADMIN') redirect('/dashboard');

  return <InstitutionShell>{children}</InstitutionShell>;
}
