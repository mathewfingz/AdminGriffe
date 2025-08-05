import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Define Role enum locally since it might not be exported
enum Role {
  ADMIN = 'ADMIN',
  TIENDA = 'TIENDA'
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default stores
  const adminStore = await prisma.store.upsert({
    where: { id: 'admin-store' },
    update: {},
    create: {
      id: 'admin-store',
      name: 'AdminGriffe Central',
      description: 'Central administration store',
      isActive: true,
    },
  });

  const demoStore = await prisma.store.upsert({
    where: { id: 'demo-store' },
    update: {},
    create: {
      id: 'demo-store',
      name: 'Demo Store',
      description: 'Demo store for testing purposes',
      isActive: true,
    },
  });

  console.log('✅ Stores created:', { adminStore: adminStore.name, demoStore: demoStore.name });

  // Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@admingriffe.com' },
    update: {},
    create: {
      email: 'admin@admingriffe.com',
      name: 'Admin User',
      password: hashedAdminPassword,
      role: Role.ADMIN,
      storeId: adminStore.id,
      emailVerified: new Date(),
    },
  });

  // Create demo store user
  const hashedStorePassword = await bcrypt.hash('store123', 12);
  const storeUser = await prisma.user.upsert({
    where: { email: 'store@admingriffe.com' },
    update: {},
    create: {
      email: 'store@admingriffe.com',
      name: 'Store Manager',
      password: hashedStorePassword,
      role: Role.TIENDA,
      storeId: demoStore.id,
      emailVerified: new Date(),
    },
  });

  console.log('✅ Users created:', { 
    admin: adminUser.email, 
    store: storeUser.email 
  });

  // Create additional demo stores for testing
  const stores = [
    {
      id: 'fashion-store',
      name: 'Fashion Boutique',
      description: 'Premium fashion and accessories',
    },
    {
      id: 'tech-store',
      name: 'Tech Hub',
      description: 'Latest technology and gadgets',
    },
    {
      id: 'home-store',
      name: 'Home & Garden',
      description: 'Home improvement and garden supplies',
    },
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { id: store.id },
      update: {},
      create: {
        ...store,
        isActive: true,
      },
    });
  }

  console.log('✅ Demo stores created');

  // Create demo users for each store
  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];
    const hashedPassword = await bcrypt.hash(`demo${i + 1}23`, 12);
    
    await prisma.user.upsert({
      where: { email: `manager${i + 1}@${store.id}.com` },
      update: {},
      create: {
        email: `manager${i + 1}@${store.id}.com`,
        name: `${store.name} Manager`,
        password: hashedPassword,
        role: Role.TIENDA,
        storeId: store.id,
        emailVerified: new Date(),
      },
    });
  }

  console.log('✅ Demo users created');

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('👤 Admin: admin@admingriffe.com / admin123');
  console.log('🏪 Store: store@admingriffe.com / store123');
  console.log('🧪 Demo stores: manager1@fashion-store.com / demo123, etc.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });