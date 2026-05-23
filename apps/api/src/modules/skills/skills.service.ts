import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { ClaimSkillDto, SkillsCatalogQueryDto, UpdateUserSkillDto } from './dto';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async catalog(query: SkillsCatalogQueryDto) {
    const where = {
      ...(query.category ? { category: query.category } : {}),
      ...(query.q ? { name: { contains: query.q, mode: 'insensitive' as const } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.skillCatalog.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { name: 'asc' },
      }),
      this.prisma.skillCatalog.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async listMine(userId: string) {
    return this.prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async claim(userId: string, dto: ClaimSkillDto) {
    const skill = await this.prisma.skillCatalog.findUnique({ where: { id: dto.skillId } });
    if (!skill) throw new NotFoundException('Skill not in catalog');
    try {
      return await this.prisma.userSkill.create({
        data: { userId, skillId: skill.id, selfRatedLevel: dto.selfRatedLevel },
        include: { skill: true },
      });
    } catch {
      throw new BadRequestException('Skill already claimed');
    }
  }

  async updateRating(userId: string, userSkillId: string, dto: UpdateUserSkillDto) {
    const existing = await this.prisma.userSkill.findUnique({ where: { id: userSkillId } });
    if (!existing || existing.userId !== userId) throw new NotFoundException('UserSkill not found');
    return this.prisma.userSkill.update({
      where: { id: userSkillId },
      data: { selfRatedLevel: dto.selfRatedLevel },
    });
  }

  async remove(userId: string, userSkillId: string) {
    const existing = await this.prisma.userSkill.findUnique({ where: { id: userSkillId } });
    if (!existing || existing.userId !== userId) throw new NotFoundException('UserSkill not found');
    return this.prisma.userSkill.delete({ where: { id: userSkillId } });
  }
}
