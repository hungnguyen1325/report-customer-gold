import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDbPool, sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const pool = await getDbPool();
    const reqQuery = pool.request();

    // Fetch authorized tables detail
    let tablesQuery = `
      SET NOCOUNT ON;
      SELECT dt.id, dt.name, dt.display_name, dt.description 
      FROM data_table dt WITH (NOLOCK)
    `;
    if (session.role !== 'admin') {
      tablesQuery = `
        SET NOCOUNT ON;
        SELECT dt.id, dt.name, dt.display_name, dt.description 
        FROM data_table dt WITH (NOLOCK)
        INNER JOIN account_data ad WITH (NOLOCK) ON dt.id = ad.fk_data_table_id
        WHERE ad.fk_accountid = @accountId
      `;
      reqQuery.input('accountId', sql.BigInt, session.id);
    }

    const tablesRes = await reqQuery.query(tablesQuery);

    return NextResponse.json({
      user: {
        id: session.id,
        username: session.username,
        full_name: session.full_name,
        role: session.role,
        allowedTables: session.allowedTables,
      },
      tables: tablesRes.recordset,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Lỗi xác thực người dùng: ' + error.message },
      { status: 500 }
    );
  }
}
