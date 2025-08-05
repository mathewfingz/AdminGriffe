import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // First, create a tenant if it doesn't exist
    let tenant = await prisma.tenant.findFirst({
      where: { name: 'Default Tenant' }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Default Tenant',
          slug: 'default',
          isActive: true,
        }
      });
      console.log('✅ Default tenant created:', tenant.id);
    } else {
      console.log('✅ Default tenant already exists:', tenant.id);
    }

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        email: 'admin@griffe.com',
        tenantId: tenant.id 
      }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123456', 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@griffe.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        tenantId: tenant.id,
        isActive: true,
      }
    });

    console.log('✅ Admin user created successfully:', {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
    });

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();