import sql from 'mssql';

const config = {
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  server: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  database: process.env.DATABASE_NAME,
  options: {
    encrypt: process.env.DATABASE_ENCRYPT === 'true',
    trustServerCertificate: true,
  },
};

if (!config.user || !config.password || !config.server || !config.database) {
  throw new Error('Missing database environment variables in .env');
}

async function inspectTables() {
  const pool = await sql.connect(config);
  
  for (const table of ['Vang_NamPhong', 'gd_history']) {
    console.log(`\n--- Inspecting Table: ${table} ---`);
    const countRes = await pool.request().query(`SELECT COUNT(*) as total FROM [${table}]`);
    console.log(`Total rows in ${table}:`, countRes.recordset[0].total);

    const colsRes = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}'
      ORDER BY ORDINAL_POSITION
    `);
    console.table(colsRes.recordset);

    const sample = await pool.request().query(`SELECT TOP 2 * FROM [${table}]`);
    console.log('Sample row:', sample.recordset[0]);
  }

  await pool.close();
}

inspectTables();
