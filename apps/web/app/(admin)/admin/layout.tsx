import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export const metadata = { title: 'SkillVerify · Admin' };

/**
 * Admin portal layout. Server-side guard mirrors the API's @Roles check:
 *  - no session → /login
 *  - signed in but not a platform admin → bounce to the student dashboard
 * Without this, any signed-in user could load the admin shell (its API calls
 * would 403, but the UI shouldn't render at all).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const role = session?.role as string | undefined;
  if (role !== 'PLATFORM_ADMIN') redirect('/dashboard');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/admin" className="inline-flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5 text-primary" />
            SkillVerify Admin
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin/verifications" className="hover:text-primary">
              Verification queue
            </Link>
            <Link href="/admin/institutions" className="hover:text-primary">
              Institutions
            </Link>
            <Link href="/admin/recruiters" className="hover:text-primary">
              Recruiters
            </Link>
            <Link href="/admin/institution-admins" className="hover:text-primary">
              Institution admins
            </Link>
            <Link href="/admin/interviewers" className="hover:text-primary">
              Interviewers
            </Link>
            <Link href="/admin/interviews" className="hover:text-primary">
              Reviews
            </Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              ← Student app
            </Link>
          </nav>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
