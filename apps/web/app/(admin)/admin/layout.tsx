import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export const metadata = { title: 'SkillVerify · Admin' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
