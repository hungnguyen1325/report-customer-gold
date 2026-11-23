import sql from 'mssql';
import bcrypt from 'bcryptjs';

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

async function initSchema() {
  console.log('Connecting to SQL Server to initialize schema...');
  const pool = await sql.connect(config);

  console.log('Creating tables if not exist...');

  // 1. accounts table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'accounts')
    BEGIN
      CREATE TABLE accounts (
        id BIGINT IDENTITY(1,1) NOT NULL,
        username VARCHAR(100) NOT NULL,
        password NVARCHAR(255) NOT NULL,
        full_name NVARCHAR(200) NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'admin',
        active BIT NOT NULL DEFAULT 1,
        create_at DATETIME NOT NULL DEFAULT GETDATE(),
        update_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_accounts PRIMARY KEY (id),
        CONSTRAINT UQ_accounts_username UNIQUE (username)
      );
      PRINT 'Created accounts table';
    END
  `);

  // 2. data_table table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'data_table')
    BEGIN
      CREATE TABLE data_table (
        id INT IDENTITY(1,1) NOT NULL,
        name NVARCHAR(150) NOT NULL,
        display_name NVARCHAR(250) NULL,
        description NVARCHAR(500) NULL,
        create_at DATETIME NOT NULL DEFAULT GETDATE(),
        update_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_data_table PRIMARY KEY (id),
        CONSTRAINT UQ_data_table_name UNIQUE (name)
      );
      PRINT 'Created data_table table';
    END
  `);

  // 3. account_data table
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'account_data')
    BEGIN
      CREATE TABLE account_data (
        fk_accountid BIGINT NOT NULL,
        fk_data_table_id INT NOT NULL,
        create_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_account_data PRIMARY KEY (fk_accountid, fk_data_table_id),
        CONSTRAINT FK_account_data_account FOREIGN KEY (fk_accountid) REFERENCES accounts(id) ON DELETE CASCADE,
        CONSTRAINT FK_account_data_table FOREIGN KEY (fk_data_table_id) REFERENCES data_table(id) ON DELETE CASCADE
      );
      PRINT 'Created account_data table';
    END
  `);

  // Seed data_table with existing tables: Vang_NamPhong and gd_history
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM data_table WHERE name = 'Vang_NamPhong')
    BEGIN
      INSERT INTO data_table (name, display_name, description)
      VALUES ('Vang_NamPhong', N'Vàng Nam Phong', N'Dữ liệu giao dịch vàng tiệm Nam Phong');
    END

    IF NOT EXISTS (SELECT 1 FROM data_table WHERE name = 'gd_history')
    BEGIN
      INSERT INTO data_table (name, display_name, description)
      VALUES ('gd_history', N'Lịch sử giao dịch chung', N'Bảng lưu vết lịch sử giao dịch tổng hợp');
    END
  `);

  // Seed default admin account
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('admin123', salt);

  const checkAdmin = await pool.request().query(`SELECT id FROM accounts WHERE username = 'admin'`);
  let adminId;
  if (checkAdmin.recordset.length === 0) {
    const insertAdmin = await pool.request()
      .input('password', sql.NVarChar, defaultPasswordHash)
      .query(`
        INSERT INTO accounts (username, password, full_name, role, active)
        OUTPUT INSERTED.id
        VALUES ('admin', @password, N'Quản trị viên hệ thống', 'admin', 1)
      `);
    adminId = insertAdmin.recordset[0].id;
    console.log(`Created admin account (id: ${adminId}, username: admin, password: admin123)`);
  } else {
    adminId = checkAdmin.recordset[0].id;
    console.log(`Admin account already exists (id: ${adminId})`);
  }

  // Grant admin access to all tables in data_table
  await pool.request()
    .input('adminId', sql.BigInt, adminId)
    .query(`
      INSERT INTO account_data (fk_accountid, fk_data_table_id)
      SELECT @adminId, id FROM data_table dt
      WHERE NOT EXISTS (
        SELECT 1 FROM account_data ad 
        WHERE ad.fk_accountid = @adminId AND ad.fk_data_table_id = dt.id
      )
    `);

  console.log('Granted admin permissions to all data tables.');
  console.log('Schema initialization complete!');
  await pool.close();
}

initSchema().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
