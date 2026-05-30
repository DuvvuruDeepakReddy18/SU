'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, MapPin } from 'lucide-react';

const FreelanceMap = dynamic(() => import('@/components/freelance-map'), { ssr: false });

type Point = {
  id: string;
  title: string;
  category: string;
  location: string | null;
  lat: number;
  lng: number;
  priceFrom: number | null;
  priceUnit: string | null;
  providerName: string;
};

export default function FreelanceMapPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['freelance.map'],
    queryFn: () => api<Point[]>('/freelance/services/map'),
  });

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/freelance"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> All services
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Nearby providers</h1>
        <p className="text-sm text-muted-foreground">
          {data?.length ?? 0} services with a known location. Add a city to your service listing to
          appear here.
        </p>
      </div>

      {isLoading ? (
        <div className="h-[60vh] rounded-xl bg-secondary animate-pulse" />
      ) : data && data.length > 0 ? (
        <FreelanceMap points={data} />
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No geo-tagged services yet. When providers post with a city name, we geocode it and pin
            it here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
