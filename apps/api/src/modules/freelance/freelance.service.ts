import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { GeocodeService } from './geocode.service';
import type { Prisma } from '@prisma/client';

// Portfolio-safe provider projections for the @Public() freelance endpoints.
// `select` (not `include`) on the provider User keeps its email/passwordHash
// off the public wire. Exported + asserted against a PII denylist in
// public-pii-boundary.spec.ts so this can never regress to a blanket include.
export const FREELANCE_LIST_PROVIDER_SELECT = {
  studentProfile: { select: { fullName: true, avatarUrl: true, sharableSlug: true } },
} satisfies Prisma.UserSelect;

export const FREELANCE_DETAIL_PROVIDER_SELECT = {
  studentProfile: {
    select: {
      fullName: true,
      avatarUrl: true,
      sharableSlug: true,
      headline: true,
      bio: true,
      location: true,
      githubUrl: true,
      linkedinUrl: true,
      portfolioUrl: true,
    },
  },
  institution: { select: { name: true } },
  userSkills: {
    include: { skill: true },
    where: { highestVerificationLayer: { not: 'L0_UNVERIFIED' } },
    take: 8,
  },
  // Proof of work: the provider's projects (verified work beats a free-text
  // claim, so clients see real repos/demos).
  projects: {
    select: { id: true, title: true, repoUrl: true, liveUrl: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class FreelanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geocoder: GeocodeService,
  ) {}

  list(category?: string, q?: string, sort: 'recent' | 'price_asc' | 'price_desc' = 'recent') {
    const orderBy: Record<string, 'asc' | 'desc'> =
      sort === 'price_asc'
        ? { priceFrom: 'asc' }
        : sort === 'price_desc'
          ? { priceFrom: 'desc' }
          : { createdAt: 'desc' };
    return this.prisma.freelanceService.findMany({
      where: {
        active: true,
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy,
      include: { provider: { select: FREELANCE_LIST_PROVIDER_SELECT } },
    });
  }

  async getById(id: string) {
    const svc = await this.prisma.freelanceService.findUnique({
      where: { id },
      include: { provider: { select: FREELANCE_DETAIL_PROVIDER_SELECT } },
    });
    return svc;
  }

  async create(
    userId: string,
    dto: {
      title: string;
      category: string;
      description: string;
      priceFrom?: number;
      priceUnit?: string;
      skills?: string[];
      location?: string;
      isRemote?: boolean;
    },
  ) {
    // Best-effort geocode on create if a location string is provided.
    let geo: { lat: number; lng: number } | null = null;
    if (dto.location?.trim()) {
      geo = await this.geocoder.lookup(dto.location);
    }
    return this.prisma.freelanceService.create({
      data: {
        providerId: userId,
        title: dto.title,
        category: dto.category,
        description: dto.description,
        priceFrom: dto.priceFrom ?? null,
        priceUnit: dto.priceUnit ?? null,
        skills: dto.skills ?? [],
        location: dto.location ?? null,
        geoLat: geo?.lat ?? null,
        geoLng: geo?.lng ?? null,
        isRemote: dto.isRemote ?? true,
      },
    });
  }

  mine(userId: string) {
    return this.prisma.freelanceService.findMany({
      where: { providerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  deactivate(userId: string, id: string) {
    return this.prisma.freelanceService.updateMany({
      where: { id, providerId: userId },
      data: { active: false },
    });
  }

  /** Returns only services with valid coordinates, light shape for map markers. */
  async mapPoints() {
    const items = await this.prisma.freelanceService.findMany({
      where: { active: true, geoLat: { not: null }, geoLng: { not: null } },
      select: {
        id: true,
        title: true,
        category: true,
        location: true,
        geoLat: true,
        geoLng: true,
        priceFrom: true,
        priceUnit: true,
        provider: {
          select: {
            studentProfile: { select: { fullName: true } },
          },
        },
      },
    });
    return items.map((s) => ({
      id: s.id,
      title: s.title,
      category: s.category,
      location: s.location,
      lat: s.geoLat!,
      lng: s.geoLng!,
      priceFrom: s.priceFrom,
      priceUnit: s.priceUnit,
      providerName: s.provider.studentProfile?.fullName ?? 'Provider',
    }));
  }

  async geocode(query: string) {
    return this.geocoder.lookup(query);
  }

  // ---------- Inquiries ----------

  async createInquiry(
    clientId: string,
    serviceId: string,
    brief: string,
    budgetInr?: number,
    deadlineAt?: string,
  ) {
    const svc = await this.prisma.freelanceService.findUnique({ where: { id: serviceId } });
    if (!svc) throw new NotFoundException('Service not found');
    if (svc.providerId === clientId) {
      throw new ForbiddenException("You can't inquire on your own service.");
    }
    return this.prisma.freelanceInquiry.create({
      data: {
        serviceId,
        clientId,
        providerId: svc.providerId,
        brief,
        budgetInr: budgetInr ?? null,
        deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
      },
    });
  }

  inquiriesSent(userId: string) {
    return this.prisma.freelanceInquiry.findMany({
      where: { clientId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        service: { select: { id: true, title: true, category: true } },
        provider: {
          select: {
            studentProfile: { select: { fullName: true, avatarUrl: true, sharableSlug: true } },
          },
        },
      },
    });
  }

  inquiriesReceived(userId: string) {
    return this.prisma.freelanceInquiry.findMany({
      where: { providerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        service: { select: { id: true, title: true, category: true } },
        client: {
          select: {
            studentProfile: { select: { fullName: true, avatarUrl: true, sharableSlug: true } },
          },
        },
      },
    });
  }

  async getInquiry(userId: string, inquiryId: string) {
    const i = await this.prisma.freelanceInquiry.findUnique({
      where: { id: inquiryId },
      include: {
        service: {
          select: { id: true, title: true, category: true, priceFrom: true, priceUnit: true },
        },
        client: {
          select: {
            studentProfile: { select: { fullName: true, avatarUrl: true, sharableSlug: true } },
          },
        },
        provider: {
          select: {
            studentProfile: { select: { fullName: true, avatarUrl: true, sharableSlug: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                studentProfile: { select: { fullName: true, avatarUrl: true, sharableSlug: true } },
              },
            },
          },
        },
      },
    });
    if (!i) throw new NotFoundException();
    if (i.clientId !== userId && i.providerId !== userId) throw new ForbiddenException();
    return { ...i, role: i.clientId === userId ? ('client' as const) : ('provider' as const) };
  }

  async setInquiryStatus(
    userId: string,
    inquiryId: string,
    status: 'accepted' | 'declined' | 'completed' | 'cancelled',
    providerNote?: string,
  ) {
    const i = await this.prisma.freelanceInquiry.findUnique({ where: { id: inquiryId } });
    if (!i) throw new NotFoundException();
    // accept/decline = provider only. cancel = either party. complete = either.
    if ((status === 'accepted' || status === 'declined') && i.providerId !== userId) {
      throw new ForbiddenException('Only the provider can accept or decline.');
    }
    if (i.clientId !== userId && i.providerId !== userId) throw new ForbiddenException();
    return this.prisma.freelanceInquiry.update({
      where: { id: inquiryId },
      data: { status, providerNote: providerNote ?? i.providerNote },
    });
  }

  async addInquiryMessage(userId: string, inquiryId: string, body: string) {
    const i = await this.prisma.freelanceInquiry.findUnique({ where: { id: inquiryId } });
    if (!i) throw new NotFoundException();
    if (i.clientId !== userId && i.providerId !== userId) throw new ForbiddenException();
    return this.prisma.freelanceMessage.create({
      data: { inquiryId, authorId: userId, body },
    });
  }
}
