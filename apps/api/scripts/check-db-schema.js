import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    // Try to get the structure of the User table
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 User table structure:');
    console.table(result);
    
    // Check if there are any users
    const userCount = await prisma.user.count();
    console.log(`\n👥 Total users in database: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();