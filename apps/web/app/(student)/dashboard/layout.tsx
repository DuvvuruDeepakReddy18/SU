import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { ChatWidget } from '@/components/chat-widget';
import { EmailVerifyBanner } from '@/components/email-verify-banner';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

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
