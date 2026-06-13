import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { serverApi } from '@/lib/server-api';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { ChatWidget } from '@/components/chat-widget';
import { EmailVerifyBanner } from '@/components/email-verify-banner';

type Me = {
  role: string;
  institutionId: string | null;
  studentProfile: { collegeIdUrl: string | null } | null;
} | null;

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  // OAuth-created students arrive with no institution / college-ID. Force them
  // through onboarding before any dashboard page renders. (A failed /auth/me —
  // e.g. cold start — degrades open rather than locking everyone out.)
  const me = await serverApi<Me>('/auth/me').catch(() => null);
  if (me && me.role === 'STUDENT' && (!me.institutionId || !me.studentProfile?.collegeIdUrl)) {
    redirect('/onboarding');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <EmailVerifyBanner />
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
      {/* Floating SkillBot — visible on every dashboard page */}
      <ChatWidget />
    </div>
  );
}
