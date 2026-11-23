import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkTablePermission } from '@/lib/auth';
import { getDbPool, sql, ensureTransactionTableExists } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tableName = searchParams.get('table');

    if (!tableName) {
      return NextResponse.json({ error: 'Chưa chọn bảng dữ liệu' }, { status: 400 });
    }

    const hasPermission = await checkTablePermission(session, tableName);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Không có quyền truy cập bảng này' }, { status: 403 });
    }

    const cleanTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    await ensureTransactionTableExists(cleanTableName);
    const search = searchParams.get('search')?.trim();
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const kieuCt = searchParams.get('kieuCt')?.trim();
    const khoName = searchParams.get('khoName')?.trim();
    const maQuay = searchParams.get('maQuay')?.trim();
    const status = searchParams.get('status')?.trim();
    const bpkdName = searchParams.get('bpkdName')?.trim();

    const whereClauses: string[] = ['1=1'];
    const pool = await getDbPool();
    const request = pool.request();

    if (search) {
      whereClauses.push(`(
        So_ct LIKE @search OR
        DoiTacName LIKE @search OR
        DoiTacTel LIKE @search OR
        DoiTacCCCD LIKE @search OR
        VtName LIKE @search OR
        code LIKE @search OR
        stt_rec LIKE @search
      )`);
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    if (startDate) {
      whereClauses.push(`Ngay_ct >= @startDate`);
      request.input('startDate', sql.Date, startDate);
    }

    if (endDate) {
      whereClauses.push(`Ngay_ct <= @endDate`);
      request.input('endDate', sql.Date, endDate);
    }

    if (kieuCt) {
      whereClauses.push(`KieuCt = @kieuCt`);
      request.input('kieuCt', sql.NVarChar, kieuCt);
    }

    if (khoName) {
      whereClauses.push(`KhoName = @khoName`);
      request.input('khoName', sql.NVarChar, khoName);
    }

    if (maQuay) {
      whereClauses.push(`maQuay = @maQuay`);
      request.input('maQuay', sql.NVarChar, maQuay);
    }

    if (status) {
      whereClauses.push(`status = @status`);
      request.input('status', sql.VarChar, status);
    }

    if (bpkdName) {
      whereClauses.push(`BpkdName = @bpkdName`);
      request.input('bpkdName', sql.NVarChar, bpkdName);
    }

    const query = `
      SET NOCOUNT ON;
      SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

      SELECT TOP 50000
        stt_rec, stt_rec0, FK_CtID, So_ct, Ngay_ct, datetime0, KieuCt, KhoName, maQuay,
        DoiTacName, DoiTacTel, DoiTacCCCD, DoiTacAdd,
        code, VtName, FK_DvtID,
        Tong_tlg, Tlg_au, Hlg_au, Hlg_auK,
        so_luong, gia_au, Tien_cong, Tien_da, tien,
        Dien_giai, BpkdName, TkName, status, user_id0
      FROM [${cleanTableName}] WITH (NOLOCK)
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY Ngay_ct DESC, datetime0 DESC, stt_rec DESC
    `;

    const result = await request.query(query);
    const rows = result.recordset;

    // Transform data for Excel
    const excelData = rows.map((r: any, idx: number) => ({
      'STT': idx + 1,
      'Mã giao dịch': (r.stt_rec || '').trim(),
      'Số chứng từ': (r.So_ct || '').trim(),
      'Ngày chứng từ': r.Ngay_ct ? new Date(r.Ngay_ct).toLocaleDateString('vi-VN') : '',
      'Thời gian': r.datetime0 ? new Date(r.datetime0).toLocaleString('vi-VN') : '',
      'Kiểu chứng từ': r.KieuCt || '',
      'Khách hàng': r.DoiTacName || '',
      'Số điện thoại': r.DoiTacTel || '',
      'CCCD/CMND': r.DoiTacCCCD || '',
      'Địa chỉ': r.DoiTacAdd || '',
      'Tên sản phẩm / Vàng': r.VtName || '',
      'Mã vật tư': r.code || '',
      'ĐVT': r.FK_DvtID || '',
      'Số lượng': r.so_luong || 0,
      'Tổng TL (chỉ)': r.Tong_tlg || 0,
      'TL Vàng (chỉ)': r.Tlg_au || 0,
      'Hàm lượng (%)': r.Hlg_au || 0,
      'Đơn giá vàng': r.gia_au || 0,
      'Tiền công (VNĐ)': r.Tien_cong || 0,
      'Tiền đá (VNĐ)': r.Tien_da || 0,
      'Thành tiền (VNĐ)': r.tien || 0,
      'Kho hàng': r.KhoName || '',
      'Mã quầy': r.maQuay || '',
      'Bộ phận': r.BpkdName || '',
      'Tài khoản': r.TkName || '',
      'Diễn giải': r.Dien_giai || '',
      'Nhân viên lập': r.user_id0 || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },  // STT
      { wch: 16 }, // Mã GD
      { wch: 15 }, // Số CT
      { wch: 12 }, // Ngày CT
      { wch: 18 }, // Giờ
      { wch: 16 }, // Kiểu CT
      { wch: 22 }, // Khách hàng
      { wch: 14 }, // SĐT
      { wch: 15 }, // CCCD
      { wch: 25 }, // Địa chỉ
      { wch: 24 }, // Tên vàng
      { wch: 10 }, // Mã VT
      { wch: 8 },  // ĐVT
      { wch: 10 }, // SL
      { wch: 14 }, // Tổng TL
      { wch: 14 }, // TL Vàng
      { wch: 12 }, // HL
      { wch: 14 }, // Đơn giá
      { wch: 14 }, // Tiền công
      { wch: 14 }, // Tiền đá
      { wch: 18 }, // Thành tiền
      { wch: 14 }, // Kho
      { wch: 12 }, // Quầy
      { wch: 14 }, // Bộ phận
      { wch: 14 }, // Tài khoản
      { wch: 25 }, // Diễn giải
      { wch: 12 }, // NV
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'GiaoDich');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filename = `BaoCao_GiaoDich_${cleanTableName}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
