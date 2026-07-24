import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@devoops.in';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user ${email} already exists. Skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
    },
  });

  console.log(`Seeded Super Admin: ${email} / ${password}`);
  console.log('IMPORTANT: Change this password immediately after first login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
