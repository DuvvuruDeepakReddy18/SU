import './globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: {
    default: 'SkillVerify — Verified skill portfolios for students',
    template: '%s · SkillVerify',
  },
  description:
    'AI-aggregated, four-layer-verified skill portfolios. Connect GitHub, claim skills, practice problems, and share a polished public profile.',
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
