import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDbPool, sql, ensureTransactionTableExists } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }

    const { id } = await params;
    const pool = await getDbPool();

    const tableRes = await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .query(`SELECT name FROM data_table WHERE id = @id`);

    if (tableRes.recordset.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy bảng trong hệ thống' }, { status: 404 });
    }

    const tableName = tableRes.recordset[0].name;
    const result = await ensureTransactionTableExists(tableName);

    return NextResponse.json({
      success: true,
      created: result.created,
      message: result.created
        ? `Đã tạo thành công bảng vật lý [${tableName}] trong SQL Server!`
        : `Bảng vật lý [${tableName}] đã tồn tại trong SQL Server.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
