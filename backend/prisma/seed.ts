import { CashMovementType, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const FLAT_CATEGORIES = [
  { name: 'Matériel bricolage', slug: 'materiel-bricolage' },
  { name: 'Petit électroménager', slug: 'petit-electromenager' },
  { name: 'Autre', slug: 'autre' },
];

async function main() {
  for (const category of FLAT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  const informatique = await prisma.category.upsert({
    where: { slug: 'informatique' },
    update: {},
    create: { name: 'Informatique', slug: 'informatique' },
  });

  // "PC" existait déjà à plat (avant l'introduction de la hiérarchie) : on le rattache.
  await prisma.category.upsert({
    where: { slug: 'pc' },
    update: { parentId: informatique.id },
    create: { name: 'PC', slug: 'pc', parentId: informatique.id },
  });

  // "Pièces informatique" est renommé en "Pièces" et rattaché à Informatique.
  const oldPieces = await prisma.category.findUnique({
    where: { slug: 'pieces-informatique' },
  });
  if (oldPieces) {
    await prisma.category.update({
      where: { id: oldPieces.id },
      data: { name: 'Pièces', slug: 'pieces', parentId: informatique.id },
    });
  } else {
    await prisma.category.upsert({
      where: { slug: 'pieces' },
      update: { parentId: informatique.id },
      create: { name: 'Pièces', slug: 'pieces', parentId: informatique.id },
    });
  }

  await prisma.category.upsert({
    where: { slug: 'accessoires' },
    update: { parentId: informatique.id },
    create: { name: 'Accessoires', slug: 'accessoires', parentId: informatique.id },
  });

  const adminEmail = 'admin@bi3echri.local';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: passwordHash,
        name: 'Admin',
        role: Role.ADMIN,
      },
    });
    console.log(`Admin créé : ${adminEmail} / admin123 (à changer après la première connexion)`);
  } else {
    console.log('Admin déjà existant, skip.');
  }

  const demoEmail = 'demo.vendeur@bi3echri.local';
  const existingDemoVendeur = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!existingDemoVendeur) {
    const passwordHash = await bcrypt.hash('demo123', 10);
    await prisma.user.create({
      data: {
        email: demoEmail,
        password: passwordHash,
        name: 'Vendeur Démo',
        role: Role.VENDEUR,
      },
    });
    console.log(`Vendeur démo créé : ${demoEmail} / demo123`);
  } else {
    console.log('Vendeur démo déjà existant, skip.');
  }

  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, demoModeEnabled: false },
  });

  const existingMovement = await prisma.cashMovement.findFirst();
  if (!existingMovement) {
    await prisma.cashMovement.create({
      data: {
        type: CashMovementType.RESET,
        amount: 7000,
        comment: 'Solde initial de la Canaouite',
        createdById: admin.id,
      },
    });
    console.log('Canaouite initialisée à 7000 DT.');
  } else {
    console.log('Canaouite déjà initialisée, skip.');
  }

  console.log('Seed terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
