import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { InterviewerShell } from '@/components/interviewer/interviewer-shell';

export default async function InterviewerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const role = session?.role as string | undefined;
  if (role !== 'INTERVIEWER') redirect('/dashboard');

  return <InterviewerShell>{children}</InterviewerShell>;
}
