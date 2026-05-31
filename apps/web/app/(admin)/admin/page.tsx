import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ShieldCheck } from 'lucide-react';

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin console</h1>
        <p className="text-sm text-muted-foreground">
          Platform-admin tools. Endpoints require role = PLATFORM_ADMIN.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/verifications" className="block">
          <Card className="hover:border-primary/40 transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" /> Verification queue
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Review college-ID uploads flagged by the AI pre-screen.
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/institutions" className="block">
          <Card className="hover:border-primary/40 transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-primary" /> Institution suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Approve or reject user-suggested colleges.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
