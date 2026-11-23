import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { getDbPool, sql, ensureTransactionTableExists } from '@/lib/db';

// GET: list all accounts with their assigned tables (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ quản trị viên mới có quyền xem danh sách tài khoản' }, { status: 403 });
    }

    const pool = await getDbPool();
    const accountsRes = await pool.request().query(`
      SELECT id, username, full_name, role, active, create_at, update_at
      FROM accounts
      ORDER BY id ASC
    `);

    const accounts = accountsRes.recordset;

    // Fetch assigned tables for each account with table names
    const permissionsRes = await pool.request().query(`
      SELECT ad.fk_accountid, ad.fk_data_table_id, dt.name, dt.display_name
      FROM account_data ad
      INNER JOIN data_table dt ON ad.fk_data_table_id = dt.id
    `);

    const permMap = new Map<number, { ids: number[]; names: string[] }>();
    for (const p of permissionsRes.recordset) {
      if (!permMap.has(p.fk_accountid)) {
        permMap.set(p.fk_accountid, { ids: [], names: [] });
      }
      permMap.get(p.fk_accountid)!.ids.push(p.fk_data_table_id);
      permMap.get(p.fk_accountid)!.names.push(p.name);
    }

    for (const acc of accounts) {
      const data = permMap.get(acc.id);
      acc.tables = data?.ids || [];
      acc.table_names = data?.names || [];
    }

    return NextResponse.json({ accounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new account with permissions
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ quản trị viên mới có quyền tạo tài khoản' }, { status: 403 });
    }

    const { username, password, full_name, role, active, tables, tableNames } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Tên đăng nhập và mật khẩu là bắt buộc' }, { status: 400 });
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      return NextResponse.json({ error: 'Tên đăng nhập phải có ít nhất 3 ký tự' }, { status: 400 });
    }

    const pool = await getDbPool();

    // Check duplicate username
    const checkUser = await pool.request()
      .input('username', sql.VarChar, cleanUsername)
      .query(`SELECT id FROM accounts WHERE username = @username`);

    if (checkUser.recordset.length > 0) {
      return NextResponse.json({ error: 'Tên đăng nhập này đã tồn tại' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const userRole = role === 'admin' ? 'admin' : 'user';
    const isActive = active !== false ? 1 : 0;

    const insertUser = await pool.request()
      .input('username', sql.VarChar, cleanUsername)
      .input('password', sql.NVarChar, passwordHash)
      .input('full_name', sql.NVarChar, full_name?.trim() || null)
      .input('role', sql.VarChar, userRole)
      .input('active', sql.Bit, isActive)
      .query(`
        INSERT INTO accounts (username, password, full_name, role, active)
        OUTPUT INSERTED.id, INSERTED.username, INSERTED.full_name, INSERTED.role, INSERTED.active, INSERTED.create_at
        VALUES (@username, @password, @full_name, @role, @active)
      `);

    const createdUser = insertUser.recordset[0];

    // Resolve table IDs from either tableNames (typed in by user) or tables (IDs)
    const targetTableIds: number[] = [];
    const savedTableNames: string[] = [];

    // Process tableNames directly if provided
    if (tableNames) {
      const namesList = (Array.isArray(tableNames) ? tableNames : tableNames.split(','))
        .map((s: string) => s.trim())
        .filter(Boolean);

      for (const rawName of namesList) {
        const cleanName = rawName.replace(/[^a-zA-Z0-9_]/g, '');
        if (!cleanName) continue;

        let tableRes = await pool.request()
          .input('name', sql.NVarChar, cleanName)
          .query(`SELECT id FROM data_table WHERE name = @name`);

        let tableId: number;
        if (tableRes.recordset.length > 0) {
          tableId = tableRes.recordset[0].id;
        } else {
          // Auto create in data_table
          const insertTable = await pool.request()
            .input('name', sql.NVarChar, cleanName)
            .input('displayName', sql.NVarChar, cleanName)
            .query(`
              INSERT INTO data_table (name, display_name, description)
              OUTPUT INSERTED.id
              VALUES (@name, @displayName, N'Được tạo tự động khi gán quyền tài khoản')
            `);
          tableId = insertTable.recordset[0].id;

          // Auto create physical table in SQL Server if not exists
          await ensureTransactionTableExists(cleanName);
        }

        if (!targetTableIds.includes(tableId)) {
          targetTableIds.push(tableId);
          savedTableNames.push(cleanName);
        }
      }
    } else if (Array.isArray(tables)) {
      targetTableIds.push(...tables);
    }

    // Insert into account_data
    for (const tableId of targetTableIds) {
      await pool.request()
        .input('accountId', sql.BigInt, createdUser.id)
        .input('tableId', sql.Int, tableId)
        .query(`
          INSERT INTO account_data (fk_accountid, fk_data_table_id)
          VALUES (@accountId, @tableId)
        `);
    }

    createdUser.tables = targetTableIds;
    createdUser.table_names = savedTableNames;

    return NextResponse.json({ success: true, account: createdUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
