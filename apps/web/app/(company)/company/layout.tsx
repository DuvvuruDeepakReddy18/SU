import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CompanyShell } from '@/components/company/company-shell';

/**
 * Company portal layout. Server-side guards:
 *  - no session → /login
 *  - signed in but not a recruiter → bounce to the student dashboard
 *
 * Approval-status branching (pending / rejected / approved) happens client-side
 * in <CompanyShell>, which reads /recruiters/me.
 */
export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const role = session?.role as string | undefined;
  if (role !== 'RECRUITER') redirect('/dashboard');

  return <CompanyShell>{children}</CompanyShell>;
}
