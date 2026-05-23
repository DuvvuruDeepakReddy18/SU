'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { api } from '@/lib/api';

type Summary = {
  skills: { id: string; highestVerificationLayer: string; skill: { name: string } }[];
  certs: {
    id: string;
    issuer: string;
    courseName: string;
    tier: string;
    verificationStatus: string;
  }[];
  academic: { id: string; semester: number; cgpa: number; verifiedAt: string | null }[];
  projects: { id: string; title: string; linkedSkills: string[]; repoUrl: string | null }[];
};

export default function VerificationsPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();
  const { data } = useQuery({
    enabled: !!token,
    queryKey: ['verifications.summary'],
    queryFn: () => api<Summary>('/verifications/me/summary', { token }),
  });

  const [cert, setCert] = useState({ issuer: '', courseName: '' });
  const [academic, setAcademic] = useState({ semester: 1, cgpa: 8 });

  const addCert = useMutation({
    mutationFn: () =>
      api('/verifications/certifications', { method: 'POST', token, body: JSON.stringify(cert) }),
    onSuccess: () => {
      toast.success('Certification submitted');
      setCert({ issuer: '', courseName: '' });
      qc.invalidateQueries({ queryKey: ['verifications.summary'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const addAcademic = useMutation({
    mutationFn: () =>
      api('/verifications/academic', {
        method: 'POST',
        token,
        body: JSON.stringify({ ...academic, verifiedVia: 'institution' }),
      }),
    onSuccess: () => {
      toast.success('Academic record added — L1 unlocked');
      qc.invalidateQueries({ queryKey: ['verifications.summary'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>L1 · Add academic record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="number"
              min={1}
              max={12}
              value={academic.semester}
              onChange={(e) => setAcademic({ ...academic, semester: Number(e.target.value) })}
              placeholder="Semester"
            />
            <Input
              type="number"
              step="0.01"
              min={0}
              max={10}
              value={academic.cgpa}
              onChange={(e) => setAcademic({ ...academic, cgpa: Number(e.target.value) })}
              placeholder="CGPA"
            />
            <Button onClick={() => addAcademic.mutate()} disabled={addAcademic.isPending}>
              Submit
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>L2 · Add certification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={cert.issuer}
              onChange={(e) => setCert({ ...cert, issuer: e.target.value })}
              placeholder="Issuer (e.g. AWS)"
            />
            <Input
              value={cert.courseName}
              onChange={(e) => setCert({ ...cert, courseName: e.target.value })}
              placeholder="Course name (e.g. AWS Cloud Practitioner)"
            />
            <Button
              onClick={() => addCert.mutate()}
              disabled={addCert.isPending || !cert.issuer || !cert.courseName}
            >
              Submit
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status by skill</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {data?.skills.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <span className="font-medium">{s.skill.name}</span>
                <Badge
                  variant={s.highestVerificationLayer === 'L0_UNVERIFIED' ? 'secondary' : 'default'}
                >
                  {s.highestVerificationLayer.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
