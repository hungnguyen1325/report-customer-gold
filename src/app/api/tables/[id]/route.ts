import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDbPool, sql } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }

    const { id } = await params;
    const { display_name, description } = await req.json();

    const pool = await getDbPool();
    await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .input('display_name', sql.NVarChar, display_name?.trim())
      .input('description', sql.NVarChar, description?.trim() || null)
      .query(`
        UPDATE data_table 
        SET display_name = @display_name, description = @description, update_at = GETDATE()
        WHERE id = @id
      `);

    return NextResponse.json({ success: true });
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
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }

    const { id } = await params;
    const pool = await getDbPool();

    // Cascades delete from account_data due to foreign key
    await pool.request()
      .input('id', sql.Int, parseInt(id, 10))
      .query(`DELETE FROM data_table WHERE id = @id`);

    return NextResponse.json({ success: true, message: 'Đã xóa bảng khỏi danh sách quản lý' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
