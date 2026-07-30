import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      include: { children: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
    if (!category) {
      throw new NotFoundException('Catégorie introuvable');
    }
    return category;
  }

  private async assertValidParent(parentId: string | undefined, selfId?: string) {
    if (!parentId) return;
    if (parentId === selfId) {
      throw new BadRequestException('Une catégorie ne peut pas être son propre parent');
    }
    const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new NotFoundException('Catégorie parente introuvable');
    }
    if (parent.parentId) {
      throw new BadRequestException(
        'Une sous-catégorie ne peut pas elle-même avoir de sous-catégories',
      );
    }
  }

  async create(dto: CreateCategoryDto) {
    const slug = slugify(dto.name);
    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ name: dto.name }, { slug }] },
    });
    if (existing) {
      throw new ConflictException('Cette catégorie existe déjà');
    }
    await this.assertValidParent(dto.parentId);
    return this.prisma.category.create({
      data: { name: dto.name, slug, parentId: dto.parentId },
      include: { children: true },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    if (dto.parentId !== undefined) {
      await this.assertValidParent(dto.parentId, id);
    }
    const data: { name?: string; slug?: string; parentId?: string | null } = {};
    if (dto.name) {
      data.name = dto.name;
      data.slug = slugify(dto.name);
    }
    if (dto.parentId !== undefined) {
      data.parentId = dto.parentId ?? null;
    }
    return this.prisma.category.update({ where: { id }, data, include: { children: true } });
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    if (category.children && category.children.length > 0) {
      throw new BadRequestException(
        'Impossible de supprimer une catégorie qui a des sous-catégories',
      );
    }
    const articlesCount = await this.prisma.article.count({ where: { categoryId: id } });
    if (articlesCount > 0) {
      throw new BadRequestException(
        'Impossible de supprimer une catégorie utilisée par des articles',
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}
