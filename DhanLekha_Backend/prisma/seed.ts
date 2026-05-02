import { PrismaClient, DocumentType, NomineeType, AccessType, BlockchainStatus, KYCStatus, Plan, AccountType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding DhanLekha database...');

  // Create demo user
  const pinHash = await bcrypt.hash('123456', 12);
  const user = await prisma.user.upsert({
    where: { phone: '+919876543210' },
    update: {},
    create: {
      phone: '+919876543210',
      email: 'arjun.mehta@example.com',
      name: 'Arjun Mehta',
      pinHash,
      kycStatus: KYCStatus.VERIFIED,
      kycVerifiedAt: new Date(),
      plan: Plan.PRO,
      planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      biometricEnabled: true,
      deadManEnabled: true,
      deadManDays: 180,
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f62222',
      lastActiveAt: new Date(),
    },
  });

  console.log(`✅ User created: ${user.name} (${user.phone})`);

  // Seed documents
  const docs = [
    {
      title: 'Property Deed',
      docType: DocumentType.PROPERTY,
      category: 'Real Estate',
      fileUrl: '/uploads/sample/property-deed.pdf',
      fileName: 'property-deed.pdf',
      fileSize: 245000,
      mimeType: 'application/pdf',
      encryptionKey: 'demo-enc-key-1',
      ocrStatus: 'COMPLETED' as const,
      blockchainStatus: BlockchainStatus.VERIFIED,
      documentHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
      txHash: '0xabc123def456',
      issuedBy: 'Maharashtra Revenue Dept.',
      verifiedAt: new Date(),
    },
    {
      title: 'Term Life Policy',
      docType: DocumentType.INSURANCE,
      category: 'Insurance',
      fileUrl: '/uploads/sample/insurance-policy.pdf',
      fileName: 'hdfc-term-life.pdf',
      fileSize: 189000,
      mimeType: 'application/pdf',
      encryptionKey: 'demo-enc-key-2',
      ocrStatus: 'COMPLETED' as const,
      blockchainStatus: BlockchainStatus.PENDING_TX,
      issuedBy: 'HDFC Life Insurance',
      expiryDate: new Date('2045-10-14'),
    },
    {
      title: 'Fixed Deposit Receipt',
      docType: DocumentType.FIXED_DEPOSIT,
      category: 'Bank',
      fileUrl: '/uploads/sample/fd-receipt.pdf',
      fileName: 'hdfc-fd-receipt.pdf',
      fileSize: 98000,
      mimeType: 'application/pdf',
      encryptionKey: 'demo-enc-key-3',
      ocrStatus: 'COMPLETED' as const,
      blockchainStatus: BlockchainStatus.VERIFIED,
      documentHash: '0x1a2b3c4d5e6f7890abcdef1234567890',
      txHash: '0xdef456abc789',
      issuedBy: 'HDFC Bank Ltd.',
      expiryDate: new Date('2028-10-14'),
      verifiedAt: new Date(),
    },
  ];

  for (const doc of docs) {
    await prisma.document.create({ data: { userId: user.id, ...doc } });
  }
  console.log(`✅ ${docs.length} documents seeded`);

  // Seed nominees
  const nominees = [
    {
      name: 'Rohan Sharma',
      relation: 'Son',
      phone: '+919876543211',
      email: 'rohan.sharma@example.com',
      nomineeType: NomineeType.INDIVIDUAL,
      accessType: AccessType.FULL_VAULT,
      allocationPct: 60,
      isVerified: true,
      verifiedAt: new Date(),
    },
    {
      name: 'Priya Mehta',
      relation: 'Spouse',
      phone: '+919876543212',
      email: 'priya.mehta@example.com',
      nomineeType: NomineeType.INDIVIDUAL,
      accessType: AccessType.PARTIAL,
      allocationPct: 30,
      isVerified: true,
      verifiedAt: new Date(),
    },
    {
      name: 'GiveIndia',
      relation: 'NGO',
      nomineeType: NomineeType.NGO,
      ngoName: 'GiveIndia Foundation',
      ngoRegNo: 'NGO/MH/2001/12345',
      accessType: AccessType.READ_ONLY,
      allocationPct: 10,
      isVerified: true,
    },
  ];

  for (const nom of nominees) {
    await prisma.nominee.create({ data: { userId: user.id, ...nom } });
  }
  console.log(`✅ ${nominees.length} nominees seeded`);

  // Seed connected accounts
  const accounts = [
    { provider: 'hdfc_bank', providerName: 'HDFC Bank', accountType: AccountType.BANK, accountNumber: '****4821', syncStatus: 'SYNCED' as const, holdingsJson: { balance: 842500, type: 'savings' } },
    { provider: 'zerodha', providerName: 'Zerodha', accountType: AccountType.BROKER, accountNumber: 'ZD****21', syncStatus: 'SYNCED' as const, holdingsJson: { portfolioValue: 5602500, positions: 12 } },
    { provider: 'groww', providerName: 'Groww', accountType: AccountType.MUTUAL_FUND, accountNumber: '****1234', syncStatus: 'SYNCED' as const, holdingsJson: { portfolioValue: 3735000, folios: 4 } },
  ];

  for (const acc of accounts) {
    await prisma.connectedAccount.create({ data: { userId: user.id, ...acc, lastSyncedAt: new Date() } });
  }
  console.log(`✅ ${accounts.length} connected accounts seeded`);

  // Seed demo transactions
  const demoTxns = [
    {
      razorpayOrderId: 'order_demo_001',
      razorpayPaymentId: 'pay_demo_001',
      amount: 5,
      purpose: 'DOCUMENT_UPLOAD' as const,
      status: 'SUCCESS' as const,
      documentId: null,
      accountProvider: null,
      blockchainTxHash: '0xabc123def456789abcdef0123456789abcdef0123456789abcdef0123456789ab',
      blockchainProof: {
        proofHash: 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd',
        txHash: '0xabc123def456789abcdef0123456789abcdef0123456789abcdef0123456789ab',
        blockNumber: 55123456,
        network: 'Polygon',
        contractAddress: '0xDhanLekhaVaultContract',
        timestamp: new Date().toISOString(),
        ownerUserId: user.id,
        accessorIds: [user.id],
      },
    },
    {
      razorpayOrderId: 'order_demo_002',
      razorpayPaymentId: 'pay_demo_002',
      amount: 10,
      purpose: 'API_INTEGRATION' as const,
      status: 'SUCCESS' as const,
      documentId: null,
      accountProvider: 'zerodha',
      blockchainTxHash: '0xdef456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01',
      blockchainProof: {
        proofHash: 'b2c3d4e5f6789012345678901234567890123456789012345678901234abcdef',
        txHash: '0xdef456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01',
        blockNumber: 55124001,
        network: 'Polygon',
        contractAddress: '0xDhanLekhaVaultContract',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        ownerUserId: user.id,
        accessorIds: [user.id],
      },
    },
  ];

  for (const txn of demoTxns) {
    await prisma.transaction.create({
      data: { userId: user.id, ...txn },
    });
  }
  console.log(`✅ ${demoTxns.length} demo transactions seeded`);

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────────────');
  console.log(`Demo user phone: +919876543210`);
  console.log(`Demo user PIN:   123456`);
  console.log('─────────────────────────────────────\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
