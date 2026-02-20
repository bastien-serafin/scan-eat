import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getBySlug(slug: string, tableId: string) {
    const establishment = await this.prisma.establishment.findUnique({
      where: { slug },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            products: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                optionGroups: true,
              },
            },
          },
        },
        tables: true,
      },
    });

    if (!establishment) {
      throw new NotFoundException('Etablissement introuvable');
    }

    const table = establishment.tables.find((t: { id: string }) => t.id === tableId);
    if (!table) {
      throw new NotFoundException('Table introuvable');
    }

    return {
      establishment: {
        id: establishment.id,
        name: establishment.name,
        slug: establishment.slug,
        timezone: establishment.timezone,
      },
      table,
      categories: establishment.categories,
    };
  }
}
