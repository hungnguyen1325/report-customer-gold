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
      .query(`SELECT * FROM [${cleanTableName}] WHERE stt_rec = @stt_rec`);

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy giao dịch' }, { status: 404 });
    }

    return NextResponse.json({ transaction: result.recordset[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ stt_rec: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { stt_rec } = await params;
    const body = await req.json();
    const { tableName, record, stt_rec0, FK_CtID } = body;

    if (!tableName || !record) {
      return NextResponse.json({ error: 'Thiếu dữ liệu' }, { status: 400 });
    }

    const hasPermission = await checkTablePermission(session, tableName);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }

    const cleanTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    const pool = await getDbPool();

    const updateReq = pool.request()
      .input('stt_rec', sql.Char(13), decodeURIComponent(stt_rec).padEnd(13, ' '))
      .input('stt_rec0', sql.Char(3), (stt_rec0 || record.stt_rec0 || '001').padEnd(3, ' '))
      .input('FK_CtID', sql.Char(3), (FK_CtID || record.FK_CtID || 'HD1').padEnd(3, ' '))
      .input('DoiTacName', sql.NVarChar(250), record.DoiTacName || null)
      .input('DoiTacTel', sql.VarChar(25), record.DoiTacTel || null)
      .input('DoiTacAdd', sql.NVarChar(300), record.DoiTacAdd || null)
      .input('DoiTacCCCD', sql.VarChar(25), record.DoiTacCCCD || null)
      .input('So_ct', sql.VarChar(50), record.So_ct || null)
      .input('KieuCt', sql.NVarChar(50), record.KieuCt || null)
      .input('KhoName', sql.NVarChar(250), record.KhoName || null)
      .input('maQuay', sql.NVarChar(350), record.maQuay || null)
      .input('code', sql.VarChar(25), record.code || null)
      .input('FK_VtID', sql.VarChar(25), record.FK_VtID || null)
      .input('FK_DvtID', sql.NVarChar(50), record.FK_DvtID || null)
      .input('VtName', sql.NVarChar(250), record.VtName || null)
      .input('Hlg_au', sql.Numeric(16, 3), record.Hlg_au !== undefined ? record.Hlg_au : null)
      .input('Hlg_auK', sql.VarChar(25), record.Hlg_auK || null)
      .input('Tlg_au', sql.Numeric(16, 3), record.Tlg_au !== undefined ? record.Tlg_au : null)
      .input('Tong_tlg', sql.Numeric(16, 3), record.Tong_tlg !== undefined ? record.Tong_tlg : null)
      .input('Tien_cong', sql.Numeric(16, 2), record.Tien_cong !== undefined ? record.Tien_cong : null)
      .input('Tien_da', sql.Numeric(16, 2), record.Tien_da !== undefined ? record.Tien_da : null)
      .input('gia_au', sql.Numeric(16, 4), record.gia_au !== undefined ? record.gia_au : null)
      .input('tien', sql.Numeric(16, 2), record.tien !== undefined ? record.tien : null)
      .input('so_luong', sql.Numeric(13, 3), record.so_luong !== undefined ? record.so_luong : 1)
      .input('Dien_giai', sql.NVarChar(350), record.Dien_giai || null)
      .input('BpkdName', sql.NVarChar(250), record.BpkdName || null)
      .input('status', sql.VarChar(50), record.status || '1')
      .input('dateEdit', sql.DateTime, new Date())
      .input('user_id2', sql.VarChar(25), session.username);

    await updateReq.query(`
      UPDATE [${cleanTableName}]
      SET DoiTacName = @DoiTacName,
          DoiTacTel = @DoiTacTel,
          DoiTacAdd = @DoiTacAdd,
          DoiTacCCCD = @DoiTacCCCD,
          So_ct = @So_ct,
          KieuCt = @KieuCt,
          KhoName = @KhoName,
          maQuay = @maQuay,
          code = @code,
          FK_VtID = @FK_VtID,
          FK_DvtID = @FK_DvtID,
          VtName = @VtName,
          Hlg_au = @Hlg_au,
          Hlg_auK = @Hlg_auK,
          Tlg_au = @Tlg_au,
          Tong_tlg = @Tong_tlg,
          Tien_cong = @Tien_cong,
          Tien_da = @Tien_da,
          gia_au = @gia_au,
          tien = @tien,
          so_luong = @so_luong,
          Dien_giai = @Dien_giai,
          BpkdName = @BpkdName,
          status = @status,
          dateEdit = @dateEdit,
          user_id2 = @user_id2
      WHERE stt_rec = @stt_rec AND stt_rec0 = @stt_rec0 AND FK_CtID = @FK_CtID
    `);

    invalidateSummaryCache(cleanTableName);

    return NextResponse.json({ success: true, message: 'Cập nhật giao dịch thành công' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
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
    const stt_rec0 = searchParams.get('stt_rec0');
    const FK_CtID = searchParams.get('FK_CtID');

    if (!tableName) {
      return NextResponse.json({ error: 'Chưa chọn bảng' }, { status: 400 });
    }

    const hasPermission = await checkTablePermission(session, tableName);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
    }

    const cleanTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    const pool = await getDbPool();

    let query = `DELETE FROM [${cleanTableName}] WHERE stt_rec = @stt_rec`;
    const request = pool.request()
      .input('stt_rec', sql.Char(13), decodeURIComponent(stt_rec).padEnd(13, ' '));

    if (stt_rec0) {
      query += ` AND stt_rec0 = @stt_rec0`;
      request.input('stt_rec0', sql.Char(3), stt_rec0.padEnd(3, ' '));
    }
    if (FK_CtID) {
      query += ` AND FK_CtID = @FK_CtID`;
      request.input('FK_CtID', sql.Char(3), FK_CtID.padEnd(3, ' '));
    }

    await request.query(query);

    invalidateSummaryCache(cleanTableName);

    return NextResponse.json({ success: true, message: 'Đã xóa giao dịch thành công' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
