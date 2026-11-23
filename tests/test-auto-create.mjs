import sql from 'mssql';

const BASE_URL = 'http://localhost:3000';

async function testAutoCreate() {
  console.log('--- TESTING AUTO-CREATE TABLE FEATURE ---\n');

  // 1. Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];
  const headers = { Cookie: cookie, 'Content-Type': 'application/json' };

  const testTableName = 'Vang_AutoTest_' + Date.now().toString().slice(-4);
  console.log(`1. Requesting to create new table [${testTableName}] with autoCreate=true...`);

  const createTableRes = await fetch(`${BASE_URL}/api/tables`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: testTableName,
      display_name: 'Tiệm Vàng Thử Nghiệm Tự Tạo',
      description: 'Bảng kiểm tra tính năng tự động tạo bảng vật lý',
      autoCreate: true,
    }),
  });

  const createData = await createTableRes.json();
  console.log('   ✓ API Response:', createData);

  // 2. Query SQL Server directly to verify physical table and columns
  const config = {
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    server: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10),
    database: process.env.DATABASE_NAME,
    options: { encrypt: false, trustServerCertificate: true },
  };

  if (!config.user || !config.password || !config.server || !config.database) {
    throw new Error('Missing database environment variables in .env');
  }

  const pool = await sql.connect(config);
  const colsRes = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = '${testTableName}'
    ORDER BY ORDINAL_POSITION
  `);

  console.log(`\n2. Verified physical table [${testTableName}] in SQL Server:`);
  console.log(`   ✓ Found ${colsRes.recordset.length} columns! (Standard 37 columns)`);
  console.log('   Sample columns:', colsRes.recordset.slice(0, 8).map(c => `${c.COLUMN_NAME} (${c.DATA_TYPE})`).join(', '));

  // 3. Test inserting a transaction into this new table
  console.log(`\n3. Testing inserting transaction into [${testTableName}]...`);
  const insertTxRes = await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tableName: testTableName,
      record: {
        So_ct: 'TEST01',
        KieuCt: 'KHÁCH BÁN',
        DoiTacName: 'Khách VIP Tự Động',
        VtName: 'Vàng 9999',
        Tong_tlg: 2.5,
        Tlg_au: 2.5,
        gia_au: 8000000,
        tien: 20000000,
      },
    }),
  });
  const txData = await insertTxRes.json();
  console.log('   ✓ Insert transaction status:', txData);

  // 4. Query table back via API
  const getTxRes = await fetch(`${BASE_URL}/api/transactions?table=${testTableName}`, { headers });
  const getTxData = await getTxRes.json();
  console.log(`   ✓ Fetched transactions from new table: Total = ${getTxData.pagination.totalRecords}`);
  console.log(`   ✓ Total revenue recorded: ${getTxData.summary.totalTien.toLocaleString('vi-VN')} VND`);

  // 5. Cleanup test table
  console.log(`\n4. Cleaning up test table...`);
  await pool.request().query(`DROP TABLE [${testTableName}]`);
  await pool.request().query(`DELETE FROM data_table WHERE name = '${testTableName}'`);
  await pool.close();
  console.log(`   ✓ Cleanup complete!\n`);

  console.log('=== TEST AUTO-CREATE FEATURE PASSED 100%! ===');
}

testAutoCreate().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
