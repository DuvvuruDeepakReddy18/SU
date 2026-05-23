'use client';

import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const { data } = useSession();
  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Email:</span> {data?.user?.email}
          </div>
          <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/' })}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
