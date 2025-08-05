#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user (using simple password for now)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@griffe.com' },
    update: {},
    create: {
      email: 'admin@griffe.com',
      name: 'Admin User',
      password: 'admin123', // In production, this should be hashed
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@griffe.com' },
    update: {},
    create: {
      email: 'test@griffe.com',
      name: 'Test User',
      password: 'test123', // In production, this should be hashed
      role: 'USER',
      isActive: true,
    },
  });

  console.log('✅ Test user created:', testUser.email);

  // Create sample audit configuration
  const auditConfig = await prisma.auditConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      tableName: 'users',
      isEnabled: true,
      trackInserts: true,
      trackUpdates: true,
      trackDeletes: true,
      retentionDays: 365,
      complianceLevel: 'SOX',
    },
  });

  console.log('✅ Audit configuration created for table:', auditConfig.tableName);

  // Create sync configuration
  const syncConfig = await prisma.syncConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      sourceName: 'PostgreSQL',
      targetName: 'MongoDB',
      isEnabled: true,
      syncMode: 'BIDIRECTIONAL',
      conflictResolution: 'SOURCE_WINS',
      batchSize: 1000,
      retryAttempts: 3,
    },
  });

  console.log('✅ Sync configuration created:', `${syncConfig.sourceName} -> ${syncConfig.targetName}`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });