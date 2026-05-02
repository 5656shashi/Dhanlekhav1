import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function wipeData() {
  console.log('🧹 Starting DhanLekha Data Wipe...');

  try {
    // 1. Wipe Database Tables (Ordered by dependency)
    console.log('🗄️  Wiping database tables...');
    
    await prisma.fuzzResult.deleteMany({});
    await prisma.fuzzSession.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.nomineeDocumentAccess.deleteMany({});
    await prisma.reportItem.deleteMany({});
    await prisma.wealthReport.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.nominee.deleteMany({});
    await prisma.connectedAccount.deleteMany({});
    await prisma.notification.deleteMany({});

    console.log('✅ Database wiped successfully.');

    // 2. Wipe Local Uploads
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    console.log(`📁 Wiping uploads directory: ${uploadDir}`);
    
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
        if (file !== '.gitignore' && file !== '.gitkeep') {
          const filePath = path.join(uploadDir, file);
          if (fs.lstatSync(filePath).isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
        }
      }
      console.log('✅ Uploads directory cleared.');
    } else {
      console.log('⚠️  Uploads directory not found.');
    }

    console.log('\n✨ DhanLekha is now in a FRESH state for your demo!');
  } catch (error) {
    console.error('❌ Data wipe failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeData();
