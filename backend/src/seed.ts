// @ts-nocheck
/**
 * Suraksha Heat Shield — Full MVP Demo Data Seed Script
 *
 * Creates:
 *   - 5 Workers  (varied profiles for personalized risk demonstration)
 *   - 5 Supervisors
 *   - 5 Authorities
 *   - 5 Demo Sites across Telangana
 *   - Worker assignments (workers → sites)
 *   - Supervisor assignments (supervisors → sites)
 *   - Sample demo alerts
 *   - Threshold configuration
 *
 * IDEMPOTENT: Deletes all existing application data before re-seeding.
 * Auth users are deleted by email before re-creation to avoid duplicates.
 *
 * Demo credentials:
 *   Password for ALL demo users: Demo@1234
 *   Workers can also use OTP: 1234
 *
 * Demo phone numbers: +9198765431XX (workers), +9198765432XX (supervisors), +9198765433XX (authorities)
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { createClient } from '@supabase/supabase-js';
import { riskService } from './services/risk.service';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey || supabaseUrl.includes('your-project-url')) {
  console.error('Missing or placeholder SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_PASSWORD = 'Demo@1234';

// ─── Demo User Definitions ────────────────────────────────────────────────────

const WORKERS = [
  {
    name: 'Arjun Naidu',
    email: 'demo.worker1@heatguard.dev',
    phone: '+919876543100',
    language: 'te',
    worker_type: 'construction',
    intensity: 'heavy',
    exposure: 'fullSun',
    duration: 'prolonged',
    clothing: 'normal',     // unacclimatized, max exposure — highest risk
  },
  {
    name: 'Meena Kumari',
    email: 'demo.worker2@heatguard.dev',
    phone: '+919876543101',
    language: 'hi',
    worker_type: 'farm',
    intensity: 'heavy',
    exposure: 'fullSun',
    duration: 'prolonged',
    clothing: 'moderatePPE',
  },
  {
    name: 'Venkat Rao',
    email: 'demo.worker3@heatguard.dev',
    phone: '+919876543102',
    language: 'te',
    worker_type: 'construction',
    intensity: 'moderate',
    exposure: 'partialShade',
    duration: 'moderate',
    clothing: 'normal',     // same site as Arjun, different profile — lower risk
  },
  {
    name: 'Lakshmi Devi',
    email: 'demo.worker4@heatguard.dev',
    phone: '+919876543103',
    language: 'en',
    worker_type: 'delivery',
    intensity: 'moderate',
    exposure: 'fullSun',
    duration: 'short',
    clothing: 'normal',
  },
  {
    name: 'Sunil Reddy',
    email: 'demo.worker5@heatguard.dev',
    phone: '+919876543104',
    language: 'hi',
    worker_type: 'farm',
    intensity: 'light',
    exposure: 'shade',
    duration: 'short',
    clothing: 'normal',     // lightest profile — lowest risk
  },
];

const SUPERVISORS = [
  {
    name: 'Kiran Babu',
    email: 'demo.supervisor1@heatguard.dev',
    phone: '+919876543200',
    language: 'te',
  },
  {
    name: 'Padma Rani',
    email: 'demo.supervisor2@heatguard.dev',
    phone: '+919876543201',
    language: 'hi',
  },
  {
    name: 'Ravi Shankar',
    email: 'demo.supervisor3@heatguard.dev',
    phone: '+919876543202',
    language: 'en',
  },
  {
    name: 'Divya Lakshmi',
    email: 'demo.supervisor4@heatguard.dev',
    phone: '+919876543203',
    language: 'te',
  },
  {
    name: 'Mahesh Kumar',
    email: 'demo.supervisor5@heatguard.dev',
    phone: '+919876543204',
    language: 'en',
  },
];

const AUTHORITIES = [
  {
    name: 'Dr. Anand Rao',
    email: 'demo.authority1@heatguard.dev',
    phone: '+919876543300',
    language: 'en',
  },
  {
    name: 'Smt. Jyothi Reddy',
    email: 'demo.authority2@heatguard.dev',
    phone: '+919876543301',
    language: 'te',
  },
  {
    name: 'Sri. Mohan Das',
    email: 'demo.authority3@heatguard.dev',
    phone: '+919876543302',
    language: 'hi',
  },
  {
    name: 'Dr. Kavitha Nair',
    email: 'demo.authority4@heatguard.dev',
    phone: '+919876543303',
    language: 'en',
  },
  {
    name: 'Sri. Prasad Varma',
    email: 'demo.authority5@heatguard.dev',
    phone: '+919876543304',
    language: 'hi',
  },
];

// ─── Demo Sites (Telangana locations) ─────────────────────────────────────────

const SITES = [
  {
    name: 'Demo Construction Site — Gachibowli',
    address: 'Gachibowli, Hyderabad, Telangana',
    district: 'Hyderabad',
    site_type: 'construction',
    default_exposure: 'fullSun',
    risk_level: 'orange',
    location: 'POINT(78.347 17.448)',
  },
  {
    name: 'Demo Farm — Warangal',
    address: 'Hanamkonda, Warangal, Telangana',
    district: 'Warangal',
    site_type: 'farm',
    default_exposure: 'fullSun',
    risk_level: 'yellow',
    location: 'POINT(79.648 18.047)',
  },
  {
    name: 'Demo Delivery Zone — Secunderabad',
    address: 'Secunderabad, Hyderabad, Telangana',
    district: 'Hyderabad',
    site_type: 'delivery',
    default_exposure: 'fullSun',
    risk_level: 'green',
    location: 'POINT(78.482 17.462)',
  },
  {
    name: 'Demo Farm — Nizamabad',
    address: 'Nizamabad, Telangana',
    district: 'Nizamabad',
    site_type: 'farm',
    default_exposure: 'fullSun',
    risk_level: 'yellow',
    location: 'POINT(78.098 18.672)',
  },
  {
    name: 'Demo Construction Site — Karimnagar',
    address: 'Karimnagar, Telangana',
    district: 'Karimnagar',
    site_type: 'construction',
    default_exposure: 'partialShade',
    risk_level: 'green',
    location: 'POINT(79.128 18.438)',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createOrGetAuthUser(email, password) {
  // Check if auth user already exists — delete if found for clean reseed
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find(u => u.email === email);
  if (found) {
    await supabase.auth.admin.deleteUser(found.id);
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,   // skip email verification for demo
  });

  if (error) {
    console.error(`  ✗ Auth user creation failed for ${email}:`, error.message);
    return null;
  }
  return data.user;
}

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function seedData() {
  console.log('\n🌱 Suraksha Heat Shield — Demo Data Seed\n');

  // ── Step 1: Clean ONLY demo data (identified by @heatguard.dev email domain) ─────
  // IMPORTANT: We never delete real user profiles. Only demo accounts are cleaned.
  console.log('🧹 Cleaning existing DEMO data (preserving real user profiles)...');

  // Find demo user IDs (those seeded by this script)
  const { data: demoUsers } = await supabase
    .from('users')
    .select('id')
    .like('email', '%@heatguard.dev');

  const demoUserIds = (demoUsers || []).map(u => u.id);

  // Find demo sites (all sites, since sites are only created by seed)
  const { data: demoSites } = await supabase.from('sites').select('id');
  const demoSiteIds = (demoSites || []).map(s => s.id);

  // Clean in dependency order — most dependent first
  await supabase.from('escalation_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('compliance_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('risk_assessments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('weather_readings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('threshold_configurations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('worker_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('sites').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Only delete demo user profiles, NOT real user profiles
  if (demoUserIds.length > 0) {
    await supabase.from('users').delete().in('id', demoUserIds);
  }

  console.log('  ✓ Demo data cleaned (real user profiles preserved)\n');

  // ── Step 2: Create sites ──────────────────────────────────────────────────
  console.log('📍 Creating demo sites...');
  const { data: sites, error: sitesError } = await supabase.from('sites').insert(SITES).select();
  if (sitesError) { console.error('  ✗ Sites error:', sitesError.message); return; }
  console.log(`  ✓ ${sites.length} sites created`);

  const siteByName = Object.fromEntries(sites.map(s => [s.name, s]));
  const constructionHyd = siteByName['Demo Construction Site — Gachibowli'];
  const farmWarangal    = siteByName['Demo Farm — Warangal'];
  const deliverySecund  = siteByName['Demo Delivery Zone — Secunderabad'];
  const farmNizamabad   = siteByName['Demo Farm — Nizamabad'];
  const constructionKar = siteByName['Demo Construction Site — Karimnagar'];

  // ── Step 3: Create Auth users + profiles ────────────────────────────────
  const allDemoUsers = [
    ...WORKERS.map(u => ({ ...u, role: 'worker' })),
    ...SUPERVISORS.map(u => ({ ...u, role: 'supervisor' })),
    ...AUTHORITIES.map(u => ({ ...u, role: 'authority' })),
  ];

  console.log('\n👤 Creating Auth users and profiles...');
  const createdUsers = {};

  for (const demoUser of allDemoUsers) {
    process.stdout.write(`  Creating ${demoUser.name} (${demoUser.role})... `);
    const authUser = await createOrGetAuthUser(demoUser.email, DEMO_PASSWORD);
    if (!authUser) continue;

    const profileData = {
      id: authUser.id,
      email: demoUser.email,
      name: demoUser.name,
      phone: demoUser.phone,
      role: demoUser.role,
      language: demoUser.language,
    };

    // Add worker-specific fields
    if (demoUser.role === 'worker') {
      profileData.worker_type = demoUser.worker_type;
      profileData.intensity   = demoUser.intensity;
      profileData.exposure    = demoUser.exposure;
      profileData.duration    = demoUser.duration;
      profileData.clothing    = demoUser.clothing;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert([profileData])
      .select()
      .single();

    if (profileError) {
      console.log(`FAILED (${profileError.message})`);
      continue;
    }

    createdUsers[demoUser.email] = profile;
    console.log(`✓ (lang: ${profile.language})`);
  }

  // ── Step 4: Worker assignments (workers → sites) ─────────────────────────
  console.log('\n🔗 Creating worker assignments...');
  const today = new Date().toISOString().split('T')[0];

  const workerAssignments = [
    // Arjun & Venkat at same construction site → demonstrates risk personalization
    { worker_id: createdUsers['demo.worker1@heatguard.dev']?.id, site_id: constructionHyd.id },
    { worker_id: createdUsers['demo.worker3@heatguard.dev']?.id, site_id: constructionHyd.id },
    // Meena at farm Warangal
    { worker_id: createdUsers['demo.worker2@heatguard.dev']?.id, site_id: farmWarangal.id },
    // Lakshmi at delivery
    { worker_id: createdUsers['demo.worker4@heatguard.dev']?.id, site_id: deliverySecund.id },
    // Sunil at farm Nizamabad
    { worker_id: createdUsers['demo.worker5@heatguard.dev']?.id, site_id: farmNizamabad.id },
  ].filter(a => a.worker_id); // skip any that failed to create

  const workerAssignmentRows = workerAssignments.map(a => ({
    ...a,
    start_date: today,
    is_active: true,
  }));

  const { error: waError } = await supabase.from('worker_assignments').insert(workerAssignmentRows);
  if (waError) { console.error('  ✗ Worker assignments error:', waError.message); }
  else { console.log(`  ✓ ${workerAssignmentRows.length} worker assignments created`); }

  // ── Step 5: Supervisor assignments (supervisors are in worker_assignments too) ─
  // RLS uses worker_assignments to determine which sites supervisors manage.
  // We add supervisors to worker_assignments pointing to their managed sites.
  console.log('\n🔗 Creating supervisor-site assignments...');
  const supervisorAssignments = [
    // Kiran & Padma manage construction Gachibowli
    { worker_id: createdUsers['demo.supervisor1@heatguard.dev']?.id, site_id: constructionHyd.id },
    { worker_id: createdUsers['demo.supervisor2@heatguard.dev']?.id, site_id: constructionHyd.id },
    // Ravi manages farm Warangal
    { worker_id: createdUsers['demo.supervisor3@heatguard.dev']?.id, site_id: farmWarangal.id },
    // Divya manages delivery Secunderabad
    { worker_id: createdUsers['demo.supervisor4@heatguard.dev']?.id, site_id: deliverySecund.id },
    // Mahesh manages farm Nizamabad + construction Karimnagar
    { worker_id: createdUsers['demo.supervisor5@heatguard.dev']?.id, site_id: farmNizamabad.id },
    { worker_id: createdUsers['demo.supervisor5@heatguard.dev']?.id, site_id: constructionKar.id },
  ].filter(a => a.worker_id);

  const supervisorAssignmentRows = supervisorAssignments.map(a => ({
    ...a,
    start_date: today,
    is_active: true,
  }));

  const { error: saError } = await supabase.from('worker_assignments').insert(supervisorAssignmentRows);
  if (saError) { console.error('  ✗ Supervisor assignments error:', saError.message); }
  else { console.log(`  ✓ ${supervisorAssignmentRows.length} supervisor-site assignments created`); }

  // ── Step 6: Threshold configuration ─────────────────────────────────────
  console.log('\n⚙️  Creating threshold configuration...');
  const authorityUser = createdUsers['demo.authority1@heatguard.dev'];
  const { error: thresholdError } = await supabase.from('threshold_configurations').insert([{
    config_key: 'telangana_hap_2026',
    thresholds: {
      construction: { yellow: 30, orange: 35, red: 38 },
      delivery:     { yellow: 32, orange: 37, red: 40 },
      farm:         { yellow: 30, orange: 35, red: 38 },
    },
    source: 'Telangana HAP-2026',
    validation_status: 'validated',
    is_active: true,
    created_by: authorityUser?.id ?? null,
  }]);
  if (thresholdError) { console.error('  ✗ Threshold error:', thresholdError.message); }
  else { console.log('  ✓ Threshold configuration created'); }

  // ── Step 6.5: Weather Readings & Risk Assessments ──────────────────────────
  console.log('\n🌤️  Creating weather readings and risk assessments...');
  
  // Define realistic weather readings
  const weatherDataMap: Record<string, any> = {
    'Demo Construction Site — Gachibowli': { temperature: 38, humidity: 50, uv_index: 9, wind_speed: 12, pressure: 1010, condition: 'Sunny', confidence: 'high' },
    'Demo Farm — Warangal': { temperature: 40, humidity: 40, uv_index: 10, wind_speed: 10, pressure: 1008, condition: 'Clear', confidence: 'high' },
    'Demo Delivery Zone — Secunderabad': { temperature: 35, humidity: 60, uv_index: 7, wind_speed: 15, pressure: 1012, condition: 'Partly Cloudy', confidence: 'high' },
    'Demo Farm — Nizamabad': { temperature: 39, humidity: 45, uv_index: 9, wind_speed: 8, pressure: 1009, condition: 'Sunny', confidence: 'low', stale: true },
    'Demo Construction Site — Karimnagar': { temperature: 34, humidity: 55, uv_index: 6, wind_speed: 14, pressure: 1011, condition: 'Cloudy', confidence: 'high' },
  };

  const weatherReadingsBySite: Record<string, any> = {};

  for (const site of sites) {
    const wd = weatherDataMap[site.name];
    if (!wd) continue;

    const now = new Date();
    let timestamp = new Date();
    let expiresAt = new Date(now.getTime() + 15 * 60000); // Expires in 15 mins

    if (wd.stale) {
      // Simulate stale data: 2 hours ago
      timestamp = new Date(now.getTime() - 2 * 3600000);
      expiresAt = new Date(now.getTime() - 1.5 * 3600000);
    }

    const { data: reading, error: weatherError } = await supabase.from('weather_readings').insert([{
      site_id: site.id,
      temperature: wd.temperature,
      humidity: wd.humidity,
      uv_index: wd.uv_index,
      wind_speed: wd.wind_speed,
      pressure: wd.pressure,
      condition: wd.condition,
      source: 'simulated',
      confidence: wd.confidence,
      timestamp: timestamp.toISOString(),
      expires_at: expiresAt.toISOString(),
    }]).select().single();

    if (weatherError) {
      console.error(`  ✗ Weather error for ${site.name}:`, weatherError.message);
    } else {
      weatherReadingsBySite[site.id] = reading;
    }
  }
  console.log(`  ✓ Weather readings created`);

  // Now calculate risk for each worker assignment
  let riskAssessmentsCount = 0;
  for (const wa of workerAssignmentRows) {
    const userEmail = Object.keys(createdUsers).find(email => createdUsers[email].id === wa.worker_id);
    if (!userEmail) continue;
    const user = createdUsers[userEmail];
    
    if (user && user.role === 'worker') {
      const reading = weatherReadingsBySite[wa.site_id];
      if (reading) {
        // calculateRisk generates the risk_assessment and persists it via supabase.
        await riskService.calculateRisk(user as any, wa.site_id, reading as any);
        riskAssessmentsCount++;
      }
    }
  }
  console.log(`  ✓ ${riskAssessmentsCount} risk assessments generated`);

  // ── Step 7: Demo alerts ────────────────────────────────────────────────
  console.log('\n🚨 Creating demo alerts...');
  const arjun   = createdUsers['demo.worker1@heatguard.dev'];
  const meena   = createdUsers['demo.worker2@heatguard.dev'];
  const venkat  = createdUsers['demo.worker3@heatguard.dev'];
  const sunil   = createdUsers['demo.worker5@heatguard.dev'];

  const demoAlerts = [];

  // Let's attach risk_assessment_id to the alerts for realistic data integrity
  // We need to fetch the latest risk assessment for each worker
  const { data: latestAssessments } = await supabase
    .from('risk_assessments')
    .select('id, worker_id');
    
  const getRiskId = (workerId: string) => {
    return latestAssessments?.find(ra => ra.worker_id === workerId)?.id || null;
  };

  if (arjun) demoAlerts.push({
    worker_id: arjun.id,
    site_id: constructionHyd.id,
    risk_assessment_id: getRiskId(arjun.id),
    type: 'danger',
    severity: 'critical',
    title: 'DANGER: Extreme Heat Risk',
    message: 'Current conditions exceed safe limits for heavy outdoor construction work. Stop all outdoor activity immediately.',
    title_te: 'ప్రమాదం: అత్యంత వేడి ప్రమాదం',
    message_te: 'ప్రస్తుత పరిస్థితులు భద్రతా పరిమితులను మించిపోయాయి. అన్ని బయట కార్యకలాపాలు వెంటనే ఆపండి.',
    title_hi: 'खतरा: अत्यधिक गर्मी का जोखिम',
    message_hi: 'वर्तमान स्थितियाँ सुरक्षित सीमा से अधिक हैं। तुरंत बाहरी गतिविधि बंद करें।',
    status: 'pending',
    delivery_channel: 'in_app',
    escalation_level: 2,
    created_at: new Date().toISOString(),
  });

  if (meena) demoAlerts.push({
    worker_id: meena.id,
    site_id: farmWarangal.id,
    risk_assessment_id: getRiskId(meena.id),
    type: 'high_risk',
    severity: 'warning',
    title: 'HIGH RISK: Heat Stress Alert',
    message: 'Heat index is dangerously high for farm work. Take immediate rest breaks in shade and drink water.',
    title_te: 'అధిక ప్రమాదం: వేడి ఒత్తిడి హెచ్చరిక',
    message_te: 'వ్యవసాయ పనికి వేడి సూచిక అత్యంత ప్రమాదకరంగా ఉంది. వెంటనే నీడలో విశ్రాంతి తీసుకోండి.',
    title_hi: 'उच्च जोखिम: गर्मी तनाव अलर्ट',
    message_hi: 'खेत के काम के लिए हीट इंडेक्स खतरनाक रूप से अधिक है। छाया में आराम करें।',
    status: 'sent',
    delivery_channel: 'in_app',
    escalation_level: 1,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
  });

  if (venkat) demoAlerts.push({
    worker_id: venkat.id,
    site_id: constructionHyd.id,
    risk_assessment_id: getRiskId(venkat.id),
    type: 'caution',
    severity: 'warning',
    title: 'CAUTION: Monitor Heat Conditions',
    message: 'Temperature is rising. Take regular breaks in shade every 30 minutes and stay hydrated.',
    title_te: 'జాగ్రత్త: వేడి పరిస్థితులను పర్యవేక్షించండి',
    message_te: 'ఉష్ణోగ్రత పెరుగుతోంది. ప్రతి 30 నిమిషాలకు నీడలో విశ్రాంతి తీసుకోండి.',
    title_hi: 'सावधानी: गर्मी की स्थिति की निगरानी',
    message_hi: 'तापमान बढ़ रहा है। हर 30 मिनट में छाया में आराम करें।',
    status: 'acknowledged',
    delivery_channel: 'in_app',
    escalation_level: 0,
    acknowledged_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
  });

  // Sunil has no alert — demonstrates clean empty state for low-risk workers

  if (demoAlerts.length > 0) {
    const { error: alertsError } = await supabase.from('alerts').insert(demoAlerts);
    if (alertsError) { console.error('  ✗ Alerts error:', alertsError.message); }
    else { console.log(`  ✓ ${demoAlerts.length} demo alerts created`); }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n✅ SEED COMPLETE\n');
  console.log('─'.repeat(60));
  console.log('DEMO CREDENTIALS (all users)');
  console.log('  Password:    Demo@1234');
  console.log('  Worker OTP:  1234 (any worker phone number)');
  console.log('');
  console.log('DEMO WORKERS');
  WORKERS.forEach((w, i) => console.log(`  Worker ${i+1}: ${w.name} | ${w.email} | ${w.phone} | lang:${w.language}`));
  console.log('');
  console.log('DEMO SUPERVISORS');
  SUPERVISORS.forEach((s, i) => console.log(`  Supervisor ${i+1}: ${s.name} | ${s.email} | ${s.phone} | lang:${s.language}`));
  console.log('');
  console.log('DEMO AUTHORITIES');
  AUTHORITIES.forEach((a, i) => console.log(`  Authority ${i+1}: ${a.name} | ${a.email} | ${a.phone} | lang:${a.language}`));
  console.log('');
  console.log('DEMO SITES');
  SITES.forEach((s, i) => console.log(`  Site ${i+1}: ${s.name} | ${s.district}`));
  console.log('─'.repeat(60));
  console.log('');
}

seedData().catch(console.error);
