import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { getDbPool, sql, ensureTransactionTableExists } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ quản trị viên mới có quyền cập nhật tài khoản' }, { status: 403 });
    }

    const { id } = await params;
    const accountId = parseInt(id, 10);
    const { full_name, role, active, password, tables, tableNames } = await req.json();

    const pool = await getDbPool();

    // Prevent deactivating own account if only admin
    if (accountId === session.id && active === false) {
      return NextResponse.json({ error: 'Không thể tự vô hiệu hóa tài khoản của chính mình' }, { status: 400 });
    }

    let updateQuery = `
      UPDATE accounts
      SET full_name = @full_name,
          role = @role,
          active = @active,
          update_at = GETDATE()
    `;

    const request = pool.request()
      .input('id', sql.BigInt, accountId)
      .input('full_name', sql.NVarChar, full_name?.trim() || null)
      .input('role', sql.VarChar, role === 'admin' ? 'admin' : 'user')
      .input('active', sql.Bit, active ? 1 : 0);

    if (password && password.trim().length > 0) {
      const passwordHash = await hashPassword(password.trim());
      updateQuery += `, password = @password`;
      request.input('password', sql.NVarChar, passwordHash);
    }

    updateQuery += ` WHERE id = @id`;
    await request.query(updateQuery);

    // Resolve table IDs from tableNames (typed in by user) or tables (IDs)
    if (tableNames !== undefined || tables !== undefined) {
      const targetTableIds: number[] = [];

      if (tableNames !== undefined) {
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
          }
        }
      } else if (Array.isArray(tables)) {
        targetTableIds.push(...tables);
      }

      // Clear existing
      await pool.request()
        .input('accountId', sql.BigInt, accountId)
        .query(`DELETE FROM account_data WHERE fk_accountid = @accountId`);

      // Insert new
      for (const tableId of targetTableIds) {
        await pool.request()
          .input('accountId', sql.BigInt, accountId)
          .input('tableId', sql.Int, tableId)
          .query(`
            INSERT INTO account_data (fk_accountid, fk_data_table_id)
            VALUES (@accountId, @tableId)
          `);
      }
    }

    return NextResponse.json({ success: true, message: 'Đã cập nhật tài khoản thành công' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Chỉ quản trị viên mới có quyền xóa tài khoản' }, { status: 403 });
    }

    const { id } = await params;
    const accountId = parseInt(id, 10);

    if (accountId === session.id) {
      return NextResponse.json({ error: 'Không thể tự xóa tài khoản của chính mình' }, { status: 400 });
    }

    const pool = await getDbPool();

    // Prevent deleting the last active administrator
    const targetUser = await pool.request()
      .input('id', sql.BigInt, accountId)
      .query(`SELECT role FROM accounts WHERE id = @id`);

    if (targetUser.recordset.length === 0) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 404 });
    }

    if (targetUser.recordset[0].role === 'admin') {
      const adminCountRes = await pool.request().query(`
        SELECT COUNT(*) as total FROM accounts WHERE role = 'admin' AND active = 1
      `);
      if (adminCountRes.recordset[0].total <= 1) {
        return NextResponse.json(
          { error: 'Không thể xóa tài khoản quản trị viên duy nhất còn lại trong hệ thống' },
          { status: 400 }
        );
      }
    }

    await pool.request()
      .input('id', sql.BigInt, accountId)
      .query(`DELETE FROM accounts WHERE id = @id`);

    return NextResponse.json({ success: true, message: 'Đã xóa tài khoản thành công' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
