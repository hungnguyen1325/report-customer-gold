import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDbPool, sql, ensureTransactionTableExists } from '@/lib/db';

// GET: list all tables accessible to user (with row counts & physical status)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const pool = await getDbPool();
    const reqQuery = pool.request();
    let query = `
      SET NOCOUNT ON;
      SELECT dt.id, dt.name, dt.display_name, dt.description, dt.create_at, dt.update_at
      FROM data_table dt WITH (NOLOCK)
      ORDER BY dt.id ASC
    `;

    if (session.role !== 'admin') {
      query = `
        SET NOCOUNT ON;
        SELECT dt.id, dt.name, dt.display_name, dt.description, dt.create_at, dt.update_at
        FROM data_table dt WITH (NOLOCK)
        INNER JOIN account_data ad WITH (NOLOCK) ON dt.id = ad.fk_data_table_id
        WHERE ad.fk_accountid = @accountId
        ORDER BY dt.id ASC
      `;
      reqQuery.input('accountId', sql.BigInt, session.id);
    }

    const tablesRes = await reqQuery.query(query);
    const tables = tablesRes.recordset;

    // Optimized: Fetch physical status and row counts of all tables in 1 single metadata query
    const statsRes = await pool.request().query(`
      SELECT 
        t.name AS TableName,
        SUM(p.rows) AS TotalRows
      FROM sys.tables t
      INNER JOIN sys.partitions p ON t.object_id = p.object_id
      WHERE p.index_id IN (0, 1)
      GROUP BY t.name
    `);

    const rowCountMap = new Map<string, number>();
    for (const r of statsRes.recordset) {
      rowCountMap.set(r.TableName.toLowerCase(), Number(r.TotalRows) || 0);
    }

    for (const t of tables) {
      const lowerName = t.name.toLowerCase();
      if (rowCountMap.has(lowerName)) {
        t.physical_exists = true;
        t.total_records = rowCountMap.get(lowerName) || 0;
      } else {
        t.physical_exists = false;
        t.total_records = 0;
      }
    }

    return NextResponse.json({ tables });
  } catch (error: any) {
    return NextResponse.json({ error: 'Lỗi tải danh sách bảng: ' + error.message }, { status: 500 });
  }
}

// POST: Add new data table reference and auto-create physical table if not exists (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Không có quyền thực hiện thao tác này' }, { status: 403 });
    }

    const { name, display_name, description, autoCreate = true } = await req.json();

    if (!name || !display_name) {
      return NextResponse.json({ error: 'Tên bảng kỹ thuật và Tên hiển thị là bắt buộc' }, { status: 400 });
    }

    const cleanName = name.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanName) {
      return NextResponse.json({ error: 'Tên bảng chỉ được chứa chữ cái, số và dấu gạch dưới' }, { status: 400 });
    }

    const cleanDisplay = display_name.trim();
    const pool = await getDbPool();

    // Check if table name already exists in data_table
    const checkExists = await pool.request()
      .input('name', sql.NVarChar, cleanName)
      .query(`SELECT id FROM data_table WHERE name = @name`);

    if (checkExists.recordset.length > 0) {
      return NextResponse.json({ error: 'Tên bảng này đã được đăng ký trong hệ thống' }, { status: 400 });
    }

    // Auto create physical table in SQL Server if enabled
    let physicalCreated = false;
    if (autoCreate) {
      const res = await ensureTransactionTableExists(cleanName);
      physicalCreated = res.created;
    }

    // Insert into data_table
    const insertRes = await pool.request()
      .input('name', sql.NVarChar, cleanName)
      .input('display_name', sql.NVarChar, cleanDisplay)
      .input('description', sql.NVarChar, description?.trim() || null)
      .query(`
        INSERT INTO data_table (name, display_name, description)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.display_name, INSERTED.description
        VALUES (@name, @display_name, @description)
      `);

    const newTable = insertRes.recordset[0];
    newTable.physical_exists = true;
    newTable.total_records = 0;

    // Grant all existing admin accounts access to this table
    await pool.request()
      .input('tableId', sql.Int, newTable.id)
      .query(`
        INSERT INTO account_data (fk_accountid, fk_data_table_id)
        SELECT id, @tableId FROM accounts WHERE role = 'admin'
      `);

    const message = physicalCreated
      ? `Đã đăng ký và tự động tạo bảng [${cleanName}] thành công!`
      : `Đã đăng ký bảng [${cleanName}] thành công!`;

    return NextResponse.json({ success: true, table: newTable, message, physicalCreated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Lỗi thêm bảng: ' + error.message }, { status: 500 });
  }
}
