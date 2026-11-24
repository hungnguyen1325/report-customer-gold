import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkTablePermission } from '@/lib/auth';
import { getDbPool, sql, ensureTransactionTableExists } from '@/lib/db';
import { invalidateSummaryCache } from '@/app/api/transactions/route';
import { invalidateFilterCache } from '@/app/api/transactions/filters/route';
import { logger, getSafeErrorMessage } from '@/lib/logger';
import * as XLSX from 'xlsx';

function cleanCustomerName(raw: any) {
  if (!raw) return '';
  const str = String(raw).trim();
  const cleaned = str.replace(/^[0-9A-Za-z_-]+;[0-9A-Za-z_-]*/, '').trim();
  return (cleaned || str).slice(0, 250);
}

function parseExcelDate(val: any) {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (typeof val === 'number') {
    const ms = Math.round((val - 25569) * 86400 * 1000);
    return new Date(ms);
  }
  const parsed = new Date(val);
  if (!isNaN(parsed.getTime())) return parsed;
  return new Date();
}

function createBulkTable(tableName: string) {
  const table = new sql.Table(tableName);
  table.create = false;

  table.columns.add('stt_rec', sql.Char(13), { nullable: false });
  table.columns.add('stt_rec0', sql.Char(3), { nullable: false });
  table.columns.add('FK_CtID', sql.Char(3), { nullable: false });
  table.columns.add('FK_DoitacID', sql.VarChar(25), { nullable: true });
  table.columns.add('DoiTacName', sql.NVarChar(250), { nullable: true });
  table.columns.add('DoiTacTel', sql.VarChar(25), { nullable: true });
  table.columns.add('DoiTacAdd', sql.NVarChar(300), { nullable: true });
  table.columns.add('DoiTacCCCD', sql.VarChar(25), { nullable: true });
  table.columns.add('Ngay_ct', sql.SmallDateTime, { nullable: true });
  table.columns.add('datetime0', sql.DateTime, { nullable: true });
  table.columns.add('So_ct', sql.VarChar(50), { nullable: true });
  table.columns.add('KieuCt', sql.NVarChar(50), { nullable: true });
  table.columns.add('KhoName', sql.NVarChar(250), { nullable: true });
  table.columns.add('maQuay', sql.NVarChar(350), { nullable: true });
  table.columns.add('code', sql.VarChar(25), { nullable: true });
  table.columns.add('FK_VtID', sql.VarChar(25), { nullable: true });
  table.columns.add('FK_DvtID', sql.NVarChar(50), { nullable: true });
  table.columns.add('VtName', sql.NVarChar(250), { nullable: true });
  table.columns.add('Hlg_au', sql.Numeric(16, 3), { nullable: true });
  table.columns.add('Hlg_auK', sql.VarChar(25), { nullable: true });
  table.columns.add('Tlg_au', sql.Numeric(16, 3), { nullable: true });
  table.columns.add('Tong_tlg', sql.Numeric(16, 3), { nullable: true });
  table.columns.add('Tien_cong', sql.Numeric(16, 2), { nullable: true });
  table.columns.add('Tien_da', sql.Numeric(16, 2), { nullable: true });
  table.columns.add('gia_au', sql.Numeric(16, 4), { nullable: true });
  table.columns.add('tien', sql.Numeric(16, 2), { nullable: true });
  table.columns.add('so_luong', sql.Numeric(13, 3), { nullable: true });
  table.columns.add('FK_TkID', sql.VarChar(25), { nullable: true });
  table.columns.add('TkName', sql.NVarChar(250), { nullable: true });
  table.columns.add('Dien_giai', sql.NVarChar(350), { nullable: true });
  table.columns.add('BpkdName', sql.NVarChar(250), { nullable: true });
  table.columns.add('dateEdit', sql.DateTime, { nullable: true });
  table.columns.add('dateEdit2', sql.DateTime, { nullable: true });
  table.columns.add('dateEdit3', sql.DateTime, { nullable: true });
  table.columns.add('status', sql.VarChar(50), { nullable: true });
  table.columns.add('user_id0', sql.VarChar(25), { nullable: true });
  table.columns.add('user_id2', sql.VarChar(25), { nullable: true });

  return table;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tableName = searchParams.get('table');
    if (!tableName) {
      return NextResponse.json({ error: 'Vui lòng chọn bảng dữ liệu' }, { status: 400 });
    }

    const hasPermission = await checkTablePermission(session, tableName);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Bạn không có quyền nhập dữ liệu vào bảng này' }, { status: 403 });
    }

    const cleanTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    await ensureTransactionTableExists(cleanTableName);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Vui lòng đính kèm file Excel (.xlsx hoặc .xls)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];

    // Read rows - detect if header is at row 0 or row 1
    const rawDataWith0 = XLSX.utils.sheet_to_json<any>(sheet, { range: 0 });
    const rawDataWith1 = XLSX.utils.sheet_to_json<any>(sheet, { range: 1 });

    // Pick whichever has 'Sophieu' or 'So_ct'
    let rawRows: any[] = [];
    if (rawDataWith0.length > 0 && (rawDataWith0[0]['Sophieu'] || rawDataWith0[0]['So_ct'])) {
      rawRows = rawDataWith0;
    } else if (rawDataWith1.length > 0 && (rawDataWith1[0]['Sophieu'] || rawDataWith1[0]['So_ct'])) {
      rawRows = rawDataWith1;
    } else {
      rawRows = rawDataWith0.length > 0 ? rawDataWith0 : rawDataWith1;
    }

    if (rawRows.length === 0) {
      return NextResponse.json({ error: 'File Excel không có dòng dữ liệu hợp lệ' }, { status: 400 });
    }

    const mappedRows: any[][] = [];
    const invoiceSet = new Set<string>();
    let totalAmount = 0;
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (let i = 0; i < rawRows.length; i++) {
      const r = rawRows[i];
      const sophieu = String(r['Sophieu'] || r['So_ct'] || '').trim();
      if (!sophieu) continue;

      invoiceSet.add(sophieu);

      const stt = parseInt(r['STT'] || (i + 1), 10) || (i + 1);
      const transType = String(r['TransType'] || r['KieuCt'] || 'BAN').trim().toUpperCase();
      const isMua = transType === 'MUA' || transType.includes('BÁN') || transType === 'PNA';
      const isThu = transType === 'THU' || transType === 'PT1';
      const isChi = transType === 'CHI' || transType === 'PC1';

      const stt_rec = sophieu.slice(0, 13).padEnd(13, ' ');
      const stt_rec0 = String(stt).padStart(3, '0').slice(-3);
      const fk_ctid = isMua ? 'PNA' : isThu ? 'PT1' : isChi ? 'PC1' : 'HDA';

      const rawTenKH = r['TenKH'] || r['DoiTacName'];
      const doiTacName = cleanCustomerName(rawTenKH);
      const doiTacTel = String(r['Dienthoai'] || r['DoiTacTel'] || '').trim().slice(0, 25);
      const doiTacAdd = String(r['Diachi'] || r['DoiTacAdd'] || '').trim().slice(0, 300);
      const fk_doitacid = (doiTacTel || doiTacName || '').slice(0, 25);

      const dt = parseExcelDate(r['Ngay tao'] || r['Ngay_ct'] || r['datetime0']);
      const ngay_ct = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
      const datetime0 = dt;

      if (!minDate || ngay_ct < minDate) minDate = ngay_ct;
      if (!maxDate || ngay_ct > maxDate) maxDate = ngay_ct;

      // Handle numbers (multiply by 1000 if values are entered in thousands)
      const canNang = Math.abs(parseFloat(r['CanNang'] || r['Tong_tlg']) || 0);
      const tuoiVang = parseFloat(r['TuoiVang'] || r['Hlg_au']) || 0;
      let donGia = Math.abs(parseFloat(r['DonGia'] || r['gia_au']) || 0);
      let tienCong = Math.abs(parseFloat(r['TienCong'] || r['Tien_cong']) || 0);
      let tienDa = Math.abs(parseFloat(r['TienDa'] || r['Tien_da']) || 0);
      let rawThanhTien = parseFloat(r['ThanhTien'] || r['tien']) || 0;

      // Auto-detect unit multiplier: if typical gold amount is < 1,000,000, multiply by 1000
      const isThousands = Math.abs(rawThanhTien) < 1000000 && Math.abs(rawThanhTien) > 0;
      const mult = isThousands ? 1000 : 1;

      donGia *= mult;
      tienCong *= mult;
      tienDa *= mult;

      let tien = Math.abs(rawThanhTien) * mult;
      if (isMua || isChi) {
        tien = -tien;
      }
      totalAmount += tien;

      const tlgAuUnit = canNang * (tuoiVang > 0 ? tuoiVang / 100 : 1);
      const tong_tlg = isMua ? -canNang : canNang;
      const tlg_au = isMua ? -tlgAuUnit : tlgAuUnit;

      const kieuCt = isMua ? 'KHÁCH BÁN' : isThu ? 'THU' : isChi ? 'CHI' : 'KHÁCH MUA';
      const quay = String(r['Quay'] || r['maQuay'] || '').trim();
      const khoName = `Kho ${quay || 'Vàng'}`.slice(0, 250);
      const code = String(r['MaHang'] || r['code'] || r['FK_VtID'] || '').trim().slice(0, 25);
      const vtName = String(r['TenHang'] || r['VtName'] || '').trim().slice(0, 250);
      const fk_dvtid = String(r['Donvitinh'] || r['FK_DvtID'] || 'Chỉ').trim().slice(0, 50);

      mappedRows.push([
        stt_rec,
        stt_rec0,
        fk_ctid,
        fk_doitacid,
        doiTacName,
        doiTacTel,
        doiTacAdd,
        '',
        ngay_ct,
        datetime0,
        sophieu.slice(0, 50),
        kieuCt,
        khoName,
        quay.slice(0, 350),
        code,
        code,
        fk_dvtid,
        vtName,
        tuoiVang,
        String(tuoiVang || ''),
        tlg_au,
        tong_tlg,
        tienCong,
        tienDa,
        donGia,
        tien,
        1,
        '111',
        'Tiền mặt',
        isMua ? 'Khách bán vàng' : 'Khách mua vàng',
        '', // BpkdName (do not set counter as employee)
        null,
        null,
        null,
        '1',
        session.username || 'EXCEL',
        session.username || 'EXCEL',
      ]);
    }

    if (mappedRows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy dòng giao dịch hợp lệ để import' }, { status: 400 });
    }

    const pool = await getDbPool();
    const BATCH_SIZE = 5000;
    let insertedCount = 0;

    for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
      const chunk = mappedRows.slice(i, i + BATCH_SIZE);
      const table = createBulkTable(cleanTableName);

      for (const row of chunk) {
        table.rows.add(...row);
      }

      const request = pool.request();
      await request.bulk(table);
      insertedCount += chunk.length;
    }

    // Invalidate cached statistics and filters
    invalidateSummaryCache(cleanTableName);
    invalidateFilterCache(cleanTableName);

    logger.log(`[Import Excel] Người dùng ${session.username} nhập thành công ${insertedCount} dòng vào [${cleanTableName}]`);

    return NextResponse.json({
      success: true,
      totalRows: insertedCount,
      totalInvoices: invoiceSet.size,
      totalAmount,
      minDate: minDate?.toISOString().slice(0, 10),
      maxDate: maxDate?.toISOString().slice(0, 10),
    });
  } catch (err: any) {
    logger.error('ImportExcelAPI', err);
    return NextResponse.json(
      { error: getSafeErrorMessage(err, 'Lỗi trong quá trình nhập dữ liệu Excel') },
      { status: 500 }
    );
  }
}
