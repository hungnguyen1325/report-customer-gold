import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkTablePermission } from '@/lib/auth';
import { getDbPool, sql } from '@/lib/db';
import { invalidateSummaryCache } from '../route';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ stt_rec: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { stt_rec } = await params;
    const { searchParams } = new URL(req.url);
    const tableName = searchParams.get('table');

    if (!tableName) {
      return NextResponse.json({ error: 'Chưa chọn bảng' }, { status: 400 });
    }

    const hasPermission = await checkTablePermission(session, tableName);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }

    const cleanTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    const pool = await getDbPool();

    const result = await pool.request()
      .input('stt_rec', sql.Char(13), decodeURIComponent(stt_rec).padEnd(13, ' '))
      .query(`
        SET NOCOUNT ON;
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
        SELECT * FROM [${cleanTableName}] WITH (NOLOCK)
        WHERE stt_rec = @stt_rec
        ORDER BY stt_rec0 ASC
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy giao dịch' }, { status: 404 });
    }

    return NextResponse.json({
      transaction: result.recordset[0],
      items: result.recordset,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Chức năng chỉnh sửa hóa đơn đã bị vô hiệu hóa. Hệ thống chỉ cho phép xem báo cáo.' },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Chức năng xóa hóa đơn đã bị vô hiệu hóa. Hệ thống chỉ cho phép xem báo cáo.' },
    { status: 403 }
  );
}
