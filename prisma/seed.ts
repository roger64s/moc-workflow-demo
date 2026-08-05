import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

const defaultPermanentWorkflow = [
  {
    stepNumber: 1,
    processOrDecision: 'Start',
    taskDescription: 'Start MOC & Initial Request Submission',
    party: 'Company',
    department: 'MOC',
    category: 'Internal',
    type: 'Seq',
    dependency: 'NA',
    routingLogic: 'Go to 2',
    assignedTo: 'Originator (Engineer)',
  },
  {
    stepNumber: 2,
    processOrDecision: 'Decision',
    taskDescription: 'All Check Lists Ready?',
    party: 'Company',
    department: 'MOC',
    category: 'Internal',
    type: 'Seq',
    dependency: '1',
    routingLogic: 'If Yes Go to 4; If No Go to 3',
    assignedTo: 'Checklist Approver',
  },
  {
    stepNumber: 3,
    processOrDecision: 'Process',
    taskDescription: 'Prepare Checklists (Can be multiple, all must be ready)',
    party: 'Company',
    department: 'MOC',
    category: 'Internal',
    type: 'Parallel',
    dependency: '2',
    routingLogic: 'Go to 4 (Once completed)',
    assignedTo: 'Checklist Assessor',
  },
];

const defaultTemporaryWorkflow = [
  {
    stepNumber: 1,
    processOrDecision: 'Start',
    taskDescription: 'Start Temporary MOC & Initial Request Submission',
    party: 'Company',
    department: 'MOC',
    category: 'Internal',
    type: 'Seq',
    dependency: 'NA',
    routingLogic: 'Go to 2',
    assignedTo: 'Originator (Engineer)',
  },
  {
    stepNumber: 2,
    processOrDecision: 'Decision',
    taskDescription: 'Temporary Change Approval Required?',
    party: 'Company',
    department: 'Safety',
    category: 'Internal',
    type: 'Seq',
    dependency: '1',
    routingLogic: 'If Yes Go to 3; If No Go to 4',
    assignedTo: 'Safety Approver',
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  const user = await prisma.user.upsert({
    where: { email: 'roger@example.com' },
    update: {},
    create: {
      email: 'roger@example.com',
      name: 'Roger',
    },
  });

  const mocRequest = await prisma.mOC_Request.upsert({
    where: { requestNumber: 'MOC-2026-001' },
    update: {},
    create: {
      requestNumber: 'MOC-2026-001',
      title: 'Upgrade Safety Valve on Line 4',
      type: 'Permanent',
      status: 'Draft',
      description: 'Replacing pressure relief valve with higher capacity model.',
      initiatorId: user.id,
      facilityLayoutChange: true,
      sifOrSisChange: false,
      bypassedSafeguard: false,
    },
  });

  await prisma.workflow_Template.upsert({
    where: {
      mocType_scopeCategory: {
        mocType: 'Permanent',
        scopeCategory: 'Raw_Material',
      },
    },
    update: { stepsJson: JSON.stringify(defaultPermanentWorkflow) },
    create: {
      mocType: 'Permanent',
      scopeCategory: 'Raw_Material',
      stepsJson: JSON.stringify(defaultPermanentWorkflow),
    },
  });

  await prisma.workflow_Template.upsert({
    where: {
      mocType_scopeCategory: {
        mocType: 'Temporary',
        scopeCategory: 'Raw_Material',
      },
    },
    update: { stepsJson: JSON.stringify(defaultTemporaryWorkflow) },
    create: {
      mocType: 'Temporary',
      scopeCategory: 'Raw_Material',
      stepsJson: JSON.stringify(defaultTemporaryWorkflow),
    },
  });

  console.log(`✅ Seeded user: ${user.name}`);
  console.log(`✅ Seeded MOC Request: ${mocRequest.requestNumber}`);
  console.log('✅ Seeded workflow template defaults');
  console.log('🎉 Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

