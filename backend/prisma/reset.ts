import { PrismaClient, Role } from '@prisma/client';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

/**
 * Supprime toutes les données de l'application (articles, photos, ventes, dépenses,
 * historique Canaouite, fournisseurs, catégories, réglages) et tous les comptes
 * utilisateurs SAUF ceux ayant le rôle ADMIN. À lancer suivi de `npx prisma db seed`
 * pour repartir sur une base propre.
 */
async function main() {
  const uploadsRoot = join(process.cwd(), 'uploads');

  const nonAdminUsers = await prisma.user.findMany({
    where: { role: { not: Role.ADMIN } },
    select: { id: true },
  });

  await prisma.photo.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.cashMovement.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.article.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.appSettings.deleteMany();
  await prisma.user.deleteMany({ where: { role: { not: Role.ADMIN } } });

  const articlesDir = join(uploadsRoot, 'articles');
  if (existsSync(articlesDir)) {
    rmSync(articlesDir, { recursive: true, force: true });
  }
  for (const user of nonAdminUsers) {
    const avatarDir = join(uploadsRoot, 'avatars', user.id);
    if (existsSync(avatarDir)) {
      rmSync(avatarDir, { recursive: true, force: true });
    }
  }

  console.log(
    `Reset terminé : toutes les données supprimées, ${nonAdminUsers.length} compte(s) non-admin supprimé(s). Lancez "npx prisma db seed" pour repeupler.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
