import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed default settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      bankName: 'Demo Bank',
      geminiApiKey: '',
      faceMatchThreshold: 0.85,
      primaryColor: '06B6D4',
    },
  });

  // Seed banking products
  const products = [
    {
      id: uuidv4(),
      name: 'Smart Savings Account',
      type: 'savings',
      description: 'A high-yield savings account perfect for everyday banking and building your savings.',
      features: JSON.stringify([
        'No minimum balance required',
        'Free debit card',
        'Online and mobile banking',
        'Instant transfers',
        'ATM withdrawals at 500+ locations',
      ]),
      interestRate: 6.5,
      eligibilityRules: JSON.stringify({ minAge: 18, maxAge: 70, minIncome: 0 }),
      termsConditions: 'Standard terms and conditions apply.',
      isActive: true,
      displayOrder: 1,
    },
    {
      id: uuidv4(),
      name: 'Youth Savings Account',
      type: 'savings',
      description: 'Specially designed for young adults. Higher interest rates and zero fees.',
      features: JSON.stringify([
        'Higher interest rate',
        'Zero monthly fees',
        'Financial literacy tools',
        'Mobile-first banking',
        'Parental view access',
      ]),
      interestRate: 7.5,
      eligibilityRules: JSON.stringify({ minAge: 16, maxAge: 25, minIncome: 0 }),
      termsConditions: 'Available for customers aged 16-25.',
      isActive: true,
      displayOrder: 2,
    },
    {
      id: uuidv4(),
      name: 'Current Account Plus',
      type: 'current',
      description: 'Business-friendly current account with overdraft facility and bulk payments.',
      features: JSON.stringify([
        'Overdraft facility',
        'Bulk payment processing',
        'Dedicated relationship manager',
        'Business debit card',
        'Free cheque book',
      ]),
      interestRate: null,
      eligibilityRules: JSON.stringify({ minAge: 21, minIncome: 50000 }),
      termsConditions: 'Overdraft subject to credit assessment.',
      isActive: true,
      displayOrder: 3,
    },
    {
      id: uuidv4(),
      name: 'Visa Classic Debit Card',
      type: 'debit_card',
      description: 'Secure Visa debit card linked to your savings or current account.',
      features: JSON.stringify([
        'Visa Paywave contactless',
        'International usage',
        'Online shopping enabled',
        'Instant notifications',
        'Card controls via app',
      ]),
      interestRate: null,
      eligibilityRules: JSON.stringify({ minAge: 18 }),
      termsConditions: 'Annual fee of LKR 500.',
      isActive: true,
      displayOrder: 4,
    },
    {
      id: uuidv4(),
      name: 'Personal Loan',
      type: 'loan',
      description: 'Flexible personal loan for your needs — education, medical, travel or home improvements.',
      features: JSON.stringify([
        'Up to LKR 2,000,000',
        'Flexible repayment 12-60 months',
        'Quick approval within 48 hours',
        'No collateral required',
        'Online application tracking',
      ]),
      interestRate: 12.5,
      eligibilityRules: JSON.stringify({ minAge: 21, maxAge: 60, minIncome: 30000 }),
      termsConditions: 'Subject to credit assessment and approval.',
      isActive: true,
      displayOrder: 5,
    },
    {
      id: uuidv4(),
      name: 'Fixed Deposit (1 Year)',
      type: 'fixed_deposit',
      description: 'Lock in your money for 12 months at a guaranteed high interest rate.',
      features: JSON.stringify([
        '9.5% p.a. guaranteed rate',
        'Minimum deposit LKR 25,000',
        'Monthly or maturity interest payout',
        'Auto-renewal option',
        'DICGC insured',
      ]),
      interestRate: 9.5,
      eligibilityRules: JSON.stringify({ minAge: 18, minIncome: 0 }),
      termsConditions: 'Early withdrawal penalty applies.',
      isActive: true,
      displayOrder: 6,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    });
  }

  // Seed a default flow
  const defaultFlow = {
    id: uuidv4(),
    name: 'Standard Account Opening',
    description: 'Default KYC flow for account opening',
    nodes: JSON.stringify([
      { id: '1', type: 'greeting', position: { x: 250, y: 50 }, data: { label: 'Welcome Greeting', type: 'greeting' } },
      { id: '2', type: 'collect_info', position: { x: 250, y: 180 }, data: { label: 'Collect Personal Info', type: 'collect_info' } },
      { id: '3', type: 'id_scan', position: { x: 250, y: 310 }, data: { label: 'ID Document Scan', type: 'id_scan' } },
      { id: '4', type: 'selfie', position: { x: 250, y: 440 }, data: { label: 'Selfie & Liveness', type: 'selfie' } },
      { id: '5', type: 'products', position: { x: 250, y: 570 }, data: { label: 'Product Selection', type: 'products' } },
      { id: '6', type: 'complete', position: { x: 250, y: 700 }, data: { label: 'Submit & Complete', type: 'complete' } },
    ]),
    edges: JSON.stringify([
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5' },
      { id: 'e5-6', source: '5', target: '6' },
    ]),
    isPublished: true,
    isTemplate: true,
  };

  await prisma.flow.create({ data: defaultFlow });

  console.log('Database seeded successfully!');
  console.log(`- Settings: default`);
  console.log(`- Products: ${products.length}`);
  console.log(`- Flows: 1 (Standard Account Opening)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
