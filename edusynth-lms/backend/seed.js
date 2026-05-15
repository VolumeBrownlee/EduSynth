/**
 * EduSynth Demo Seed Script
 * Run: node seed.js
 * Creates a demo tenant + demo student and lecturer accounts for pitching.
 */
require('dotenv').config();

const mongoose = require('mongoose');
const { BrandingSettings, User } = require('./models');

const DEMO_TENANT_ID = 'demo-edusynth-2024';
const DEMO_ORG_CODE = 'EDUSYNTH';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/edusynth_dev');
  console.log('Connected to MongoDB');

  // ── 1. Create demo tenant ─────────────────────────────────────────────────
  let branding = await BrandingSettings.findOne({ organizationCode: DEMO_ORG_CODE });
  if (!branding) {
    branding = await BrandingSettings.create({
      tenantId: DEMO_TENANT_ID,
      organizationName: 'EduSynth Demo University',
      organizationCode: DEMO_ORG_CODE,
    });
    console.log(`✓ Created demo tenant  (code: ${DEMO_ORG_CODE})`);
  } else {
    console.log(`  Tenant already exists (code: ${DEMO_ORG_CODE})`);
  }

  // ── 2. Demo student ───────────────────────────────────────────────────────
  const studentEmail = 'student@demo.edu';
  let student = await User.findOne({ tenantId: DEMO_TENANT_ID, email: studentEmail });
  if (!student) {
    student = await User.create({
      tenantId: DEMO_TENANT_ID,
      email: studentEmail,
      password: 'demo1234',
      firstName: 'Alex',
      lastName: 'Student',
      registrationId: 'STU2024001',
      role: 'student',
    });
    console.log(`✓ Created demo student  (${studentEmail} / demo1234)`);
  } else {
    console.log(`  Demo student already exists`);
  }

  // ── 3. Demo lecturer ──────────────────────────────────────────────────────
  const lecturerEmail = 'lecturer@demo.edu';
  let lecturer = await User.findOne({ tenantId: DEMO_TENANT_ID, email: lecturerEmail });
  if (!lecturer) {
    lecturer = await User.create({
      tenantId: DEMO_TENANT_ID,
      email: lecturerEmail,
      password: 'demo1234',
      firstName: 'Dr. Sarah',
      lastName: 'Lecturer',
      registrationId: 'LECT2024001',
      role: 'teacher',
    });
    console.log(`✓ Created demo lecturer (${lecturerEmail} / demo1234)`);
  } else {
    console.log(`  Demo lecturer already exists`);
  }

  console.log('\n━━━ Demo Credentials ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Organization Code : ${DEMO_ORG_CODE}`);
  console.log(`  Student           : ${studentEmail}  /  demo1234`);
  console.log(`  Lecturer          : ${lecturerEmail}  /  demo1234`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
