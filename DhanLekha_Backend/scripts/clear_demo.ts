import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing demo data...');
  
  try {
    // Delete in order of dependencies
    await prisma.fuzzResult.deleteMany({});
    await prisma.fuzzSession.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.reportItem.deleteMany({});
    await prisma.wealthReport.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.nominee.deleteMany({});
    await prisma.connectedAccount.deleteMany({});
    
    console.log('✅ Demo data cleared successfully. Users and essential configs preserved.');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
