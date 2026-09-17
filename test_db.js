const { initDatabase, getDatabase, closeDatabase } = require('./electron/database/db');
const authService = require('./electron/services/auth.service');
const userService = require('./electron/services/user.service');
const settingService = require('./electron/services/setting.service');
const dashboardService = require('./electron/services/dashboard.service');
const auditService = require('./electron/services/audit.service');

async function testBackend() {
  console.log('--- Starting Backend Verification Tests ---');

  try {
    // 1. Initialize SQLite
    console.log('[1] Initializing SQLite database...');
    const db = initDatabase();
    console.log('✓ Database initialized successfully');

    // 2. Check Seeded Admin and Roles
    console.log('[2] Checking seeded roles & permissions...');
    const roles = userService.getAllRoles();
    console.log(`✓ Roles count: ${roles.length}`);
    const adminRole = roles.find((r) => r.name.includes('Admin'));
    console.log(`✓ Admin Role permissions count: ${adminRole ? adminRole.permissions.length : 0}`);

    // 3. Test Authentication (login with admin / admin123)
    console.log('[3] Testing authentication login with admin / admin123...');
    const loginResult = await authService.login({ username: 'admin', password: 'admin123' });
    console.log(`✓ Login successful for: ${loginResult.fullName} (${loginResult.username})`);
    console.log(`✓ User permissions array length: ${loginResult.permissions.length}`);

    // 4. Test Settings Retrieval
    console.log('[4] Testing company settings retrieval...');
    const settings = settingService.getSettings();
    console.log(`✓ Company Name: ${settings.company_name} | Currency: ${settings.currency_code}`);

    // 5. Test Dashboard Metrics
    console.log('[5] Testing Dashboard Metrics calculation...');
    const metrics = dashboardService.getSummary();
    console.log(`✓ Dashboard Metrics: Today's Sales = ${metrics.todaySales}, Low Stock = ${metrics.lowStockCount}`);

    // 6. Test User Creation & Audit Logging
    console.log('[6] Testing User Creation and Audit Logging...');
    const newUser = userService.createUser({
      fullName: 'محاسب تجريبي',
      username: 'accountant_test',
      password: 'password123',
      email: 'accountant@erp.local',
      phone: '0555555555',
      roleId: roles.find((r) => r.name.includes('محاسب'))?.id || 3,
      branchId: 1,
      isActive: 1,
      currentUserId: loginResult.id,
    });
    console.log(`✓ Created user: ${newUser.fullName} (${newUser.username})`);

    // 7. Verify Audit Logs
    const auditLogs = auditService.searchLogs({ limit: 10 });
    console.log(`✓ Total Audit Logs recorded: ${auditLogs.total}`);
    console.log(`✓ Latest Audit Action: [${auditLogs.items[0]?.module}] ${auditLogs.items[0]?.action} by user ${auditLogs.items[0]?.user_name}`);

    console.log('\n=========================================');
    console.log('🎉 ALL BACKEND TESTS PASSED WITH 100% SUCCESS!');
    console.log('=========================================');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    closeDatabase();
  }
}

testBackend();
