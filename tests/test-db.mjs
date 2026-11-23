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
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

if (!config.user || !config.password || !config.server || !config.database) {
  throw new Error('Missing database environment variables in .env');
}

async function testConnection() {
  console.log('Connecting to SQL Server...', {
    server: config.server,
    port: config.port,
    database: config.database,
    user: config.user,
  });
  try {
    const pool = await sql.connect(config);
    console.log('Connected successfully!');

    const tables = await pool.request().query(`
      SELECT TABLE_NAME, TABLE_TYPE 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    console.log('Existing tables in database:');
    console.table(tables.recordset);

    await pool.close();
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
}

testConnection();
