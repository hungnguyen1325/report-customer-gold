import sql from 'mssql';
import { logger } from './logger';

const server = process.env.DATABASE_HOST;
const portStr = process.env.DATABASE_PORT;
const user = process.env.DATABASE_USER;
const password = process.env.DATABASE_PASS;
const database = process.env.DATABASE_NAME;

if (!server || !portStr || !user || !password || !database) {
  throw new Error(
    'Cấu hình kết nối cơ sở dữ liệu không hợp lệ. Vui lòng khai báo đầy đủ các biến môi trường: DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASS, DATABASE_NAME trong file .env'
  );
}

const config: sql.config = {
  server,
  port: parseInt(portStr, 10),
  user,
  password,
  database,
  options: {
    encrypt: process.env.DATABASE_ENCRYPT === 'true',
    trustServerCertificate: true,
  },
  pool: {
    max: 15,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export async function getDbPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = sql.connect(config).catch((err) => {
      poolPromise = null;
      logger.error('DatabaseConnection', err);
      throw err;
    });
  }
  return poolPromise;
}

/**
 * Validates table name against existing permitted tables in database
 */
export async function getValidTableName(tableName: string): Promise<string | null> {
  const pool = await getDbPool();
  const res = await pool.request()
    .input('name', sql.NVarChar, tableName)
    .query(`SELECT name FROM data_table WHERE name = @name`);
  
  if (res.recordset.length > 0) {
    return res.recordset[0].name;
  }
  return null;
}

// In-memory cache of verified physical tables in SQL Server to avoid redundant metadata queries
const verifiedPhysicalTables = new Set<string>();

/**
 * Checks if a physical table exists in SQL Server.
 * If not, automatically creates the table using the standard transaction table schema.
 */
export async function ensureTransactionTableExists(tableName: string): Promise<{ created: boolean; exists: boolean }> {
  const cleanName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  if (!cleanName) {
    throw new Error('Tên bảng không hợp lệ');
  }

  // Fast-path: Table was already verified in this server instance
  if (verifiedPhysicalTables.has(cleanName.toLowerCase())) {
    return { created: false, exists: true };
  }

  const pool = await getDbPool();

  // Check if physical table already exists
  const checkRes = await pool.request()
    .input('tableName', sql.NVarChar, cleanName)
    .query(`
      SET NOCOUNT ON;
      SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = @tableName AND TABLE_TYPE = 'BASE TABLE'
    `);

  if (checkRes.recordset.length > 0) {
    verifiedPhysicalTables.add(cleanName.toLowerCase());
    return { created: false, exists: true };
  }

  // Create table dynamically with standard gold transaction DDL
  const pkName = `PK_${cleanName}_${Date.now().toString().slice(-4)}`;
  const createSql = `
    CREATE TABLE [${cleanName}] (
      [stt_rec] [char](13) NOT NULL,
      [stt_rec0] [char](3) NOT NULL,
      [FK_CtID] [char](3) NOT NULL,
      [FK_DoitacID] [varchar](25) NULL,
      [DoiTacName] [nvarchar](250) NULL,
      [DoiTacTel] [varchar](25) NULL,
      [DoiTacAdd] [nvarchar](300) NULL,
      [DoiTacCCCD] [varchar](25) NULL,
      [Ngay_ct] [smalldatetime] NULL,
      [datetime0] [datetime] NULL,
      [So_ct] [varchar](50) NULL,
      [KieuCt] [nvarchar](50) NULL,
      [KhoName] [nvarchar](250) NULL,
      [maQuay] [nvarchar](350) NULL,
      [code] [varchar](25) NULL,
      [FK_VtID] [varchar](25) NULL,
      [FK_DvtID] [nvarchar](50) NULL,
      [VtName] [nvarchar](250) NULL,
      [Hlg_au] [numeric](16, 3) NULL,
      [Hlg_auK] [varchar](25) NULL,
      [Tlg_au] [numeric](16, 3) NULL,
      [Tong_tlg] [numeric](16, 3) NULL,
      [Tien_cong] [numeric](16, 2) NULL,
      [Tien_da] [numeric](16, 2) NULL,
      [gia_au] [numeric](16, 4) NULL,
      [tien] [numeric](16, 2) NULL,
      [so_luong] [numeric](13, 3) NULL,
      [FK_TkID] [varchar](25) NULL,
      [TkName] [nvarchar](250) NULL,
      [Dien_giai] [nvarchar](350) NULL,
      [BpkdName] [nvarchar](250) NULL,
      [dateEdit] [datetime] NULL,
      [dateEdit2] [datetime] NULL,
      [dateEdit3] [datetime] NULL,
      [status] [varchar](50) NULL,
      [user_id0] [varchar](25) NULL,
      [user_id2] [varchar](25) NULL,
      CONSTRAINT [${pkName}] PRIMARY KEY CLUSTERED 
      (
        [stt_rec] ASC,
        [stt_rec0] ASC,
        [FK_CtID] ASC
      )
    );

    -- Create performance indexes automatically
    CREATE NONCLUSTERED INDEX [IX_${cleanName}_Ngay_ct] 
    ON [${cleanName}] ([Ngay_ct] DESC)
    INCLUDE ([tien], [Tong_tlg], [Tlg_au], [Tien_cong], [Tien_da], [so_luong], [So_ct], [DoiTacName]);

    CREATE NONCLUSTERED INDEX [IX_${cleanName}_So_ct] 
    ON [${cleanName}] ([So_ct]);

    CREATE NONCLUSTERED INDEX [IX_${cleanName}_DoiTac] 
    ON [${cleanName}] ([DoiTacName])
    INCLUDE ([DoiTacTel], [DoiTacCCCD]);
  `;

  await pool.request().query(createSql);
  verifiedPhysicalTables.add(cleanName.toLowerCase());
  logger.log(`[SQL Server] Tự động tạo bảng vật lý mới: [${cleanName}] thành công.`);

  return { created: true, exists: true };
}

export { sql };
