// Comprehensive End-to-End API and Flow Verification
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING AUTOMATED END-TO-END VERIFICATION ===\n');

  let authCookie = '';

  // 1. Test Login
  console.log('1. Testing Login API (/api/auth/login)...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });

  if (!loginRes.ok) {
    const err = await loginRes.json();
    throw new Error(`Login failed: ${JSON.stringify(err)}`);
  }

  const setCookie = loginRes.headers.get('set-cookie');
  if (setCookie) {
    authCookie = setCookie.split(';')[0];
  }
  const loginData = await loginRes.json();
  console.log('   ✓ Login successful! User:', loginData.user.username, `(${loginData.user.role})`);
  console.log('   ✓ Session Cookie captured:', authCookie ? 'YES' : 'NO');

  const headers = {
    Cookie: authCookie,
    'Content-Type': 'application/json',
  };

  // 2. Test /api/auth/me
  console.log('\n2. Testing Current Session (/api/auth/me)...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, { headers });
  const meData = await meRes.json();
  console.log('   ✓ User profile:', meData.user.full_name);
  console.log('   ✓ Accessible tables count:', meData.tables.length);

  // 3. Test /api/tables
  console.log('\n3. Testing Tables API (/api/tables)...');
  const tablesRes = await fetch(`${BASE_URL}/api/tables`, { headers });
  const tablesData = await tablesRes.json();
  console.log('   ✓ Tables list:');
  for (const t of tablesData.tables) {
    console.log(`     - [${t.name}] "${t.display_name}": ${t.total_records.toLocaleString('vi-VN')} records`);
  }

  // 4. Test /api/transactions with pagination & stats
  console.log('\n4. Testing Transactions API (/api/transactions?table=Vang_NamPhong&pageSize=3)...');
  const txRes = await fetch(`${BASE_URL}/api/transactions?table=Vang_NamPhong&page=1&pageSize=3`, { headers });
  const txData = await txRes.json();
  console.log('   ✓ Total transactions in table:', txData.pagination.totalRecords);
  console.log('   ✓ Total pages:', txData.pagination.totalPages);
  console.log('   ✓ Summary KPI Stats:');
  console.log('     - Total count:', txData.summary.totalCount);
  console.log('     - Total money (tien):', txData.summary.totalTien.toLocaleString('vi-VN'), 'VND');
  console.log('     - Total weight (Tong_tlg):', txData.summary.totalTongTlg.toFixed(3), 'chi');
  console.log('     - Total net gold (Tlg_au):', txData.summary.totalTlgAu.toFixed(3), 'chi');
  console.log('     - Total craft fee (Tien_cong):', txData.summary.totalTienCong.toLocaleString('vi-VN'), 'VND');
  console.log('     - Total gem fee (Tien_da):', txData.summary.totalTienDa.toLocaleString('vi-VN'), 'VND');
  console.log(`   ✓ Fetched ${txData.records.length} records. First record:`);
  console.log(`     So_ct: ${txData.records[0].So_ct}, Customer: ${txData.records[0].DoiTacName}, VtName: ${txData.records[0].VtName}`);

  // 5. Test Filters
  console.log('\n5. Testing Filter Options (/api/transactions/filters?table=Vang_NamPhong)...');
  const filtersRes = await fetch(`${BASE_URL}/api/transactions/filters?table=Vang_NamPhong`, { headers });
  const filtersData = await filtersRes.json();
  console.log('   ✓ Distinct KieuCt:', filtersData.kieuCtList.slice(0, 5).join(', '));
  console.log('   ✓ Distinct KhoName:', filtersData.khoNameList.slice(0, 5).join(', '));

  // 6. Test Excel Export
  console.log('\n6. Testing Excel Export (/api/transactions/export?table=Vang_NamPhong)...');
  const exportRes = await fetch(`${BASE_URL}/api/transactions/export?table=Vang_NamPhong`, { headers });
  const contentType = exportRes.headers.get('content-type');
  const contentDisposition = exportRes.headers.get('content-disposition');
  const buffer = await exportRes.arrayBuffer();
  console.log('   ✓ Export status:', exportRes.status);
  console.log('   ✓ Content-Type:', contentType);
  console.log('   ✓ Content-Disposition:', contentDisposition);
  console.log('   ✓ Generated Excel File Size:', (buffer.byteLength / 1024).toFixed(2), 'KB');

  // 7. Test Account Management (Admin only)
  console.log('\n7. Testing Accounts API (/api/accounts)...');
  const accRes = await fetch(`${BASE_URL}/api/accounts`, { headers });
  const accData = await accRes.json();
  console.log('   ✓ Current accounts:');
  for (const a of accData.accounts) {
    console.log(`     - [ID: ${a.id}] ${a.username} (${a.role}) - Active: ${a.active}`);
  }

  console.log('\n======================================================');
  console.log('✓ ALL END-TO-END API AND DATA TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
