import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

const VALID_CATEGORIES = [
  'engineering',
  'management',
  'law',
  'science',
  'commerce',
  'arts',
  'medical',
  'other',
] as const;
type Category = (typeof VALID_CATEGORIES)[number];

@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Typeahead search. Matches against name (case-insensitive contains) and
   * shortName (case-insensitive contains). Curated rows (verified=true) rank
   * above user-added ones, then by NIRF rank ascending (nulls last).
   */
  async search(q: string, category?: string, limit = 20) {
    const cleanQ = (q ?? '').trim();
    const where: Record<string, unknown> = {};

    if (cleanQ.length > 0) {
      where.OR = [
        { name: { contains: cleanQ, mode: 'insensitive' } },
        { shortName: { contains: cleanQ, mode: 'insensitive' } },
      ];
    }
    if (category && VALID_CATEGORIES.includes(category as Category)) {
      where.category = category;
    }

    return this.prisma.institution.findMany({
      where,
      take: Math.min(Math.max(limit, 1), 50),
      orderBy: [{ verified: 'desc' }, { nirfRank: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        shortName: true,
        category: true,
        nirfRank: true,
        state: true,
        city: true,
        verified: true,
        domain: true,
      },
    });
  }

  async listCategories() {
    return VALID_CATEGORIES;
  }

  /**
   * Public endpoint used during signup when the user can't find their college.
   * Creates the row with `verified=false`; surfaces in the admin queue later.
   */
  async suggest(input: {
    name: string;
    domain?: string;
    category?: string;
    state?: string;
    city?: string;
    addedByUserId?: string;
  }) {
    const name = input.name.trim();
    if (name.length < 4) {
      throw new BadRequestException('Institution name is too short');
    }
    // Avoid duplicate suggestions for the same name (case-insensitive).
    const existing = await this.prisma.institution.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing) return existing;

    return this.prisma.institution.create({
      data: {
        name,
        domain: input.domain?.toLowerCase() || null,
        category:
          input.category && VALID_CATEGORIES.includes(input.category as Category)
            ? input.category
            : 'other',
        state: input.state || null,
        city: input.city || null,
        verified: false,
        addedByUserId: input.addedByUserId ?? null,
      },
    });
  }
}
