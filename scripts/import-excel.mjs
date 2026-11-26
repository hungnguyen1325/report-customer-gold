import sql from 'mssql';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

// Load .env
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  const envConfig = Object.fromEntries(
    fs.readFileSync(envPath, 'utf8')
      .split('\n')
      .filter(l => l.includes('='))
      .map(l => {
        const idx = l.indexOf('=');
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      })
  );
  for (const [k, v] of Object.entries(envConfig)) {
    if (!process.env[k]) process.env[k] = v;
  }
}

const config = {
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  server: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '1433'),
  database: process.env.DATABASE_NAME,
  options: {
    encrypt: process.env.DATABASE_ENCRYPT === 'true',
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

function cleanCustomerName(raw) {
  if (!raw) return '';
  let str = String(raw).trim();
  // Strip code prefixes like "10K1;15196HÀ THỊ QUYÊN" -> "HÀ THỊ QUYÊN"
  const cleaned = str.replace(/^[0-9A-Za-z_-]+;[0-9A-Za-z_-]*/, '').trim();
  return (cleaned || str).slice(0, 250);
}

function parseExcelDate(val) {
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

function createBulkTable(tableName) {
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

export async function importExcelFile(filePath, targetTable = 'Vang_NamPhong') {
  console.log(`[Import] Bắt đầu đọc file: ${filePath}`);
  const startTime = Date.now();

  if (!fs.existsSync(filePath)) {
    throw new Error(`File không tồn tại: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const wb = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];

  // Excel sheet headers are on Row 1 (range: 1)
  const rawRows = xlsx.utils.sheet_to_json(sheet, { range: 1 });
  console.log(`[Import] Đã phân tích ${rawRows.length} dòng dữ liệu từ Excel.`);

  if (rawRows.length === 0) {
    throw new Error('File Excel không có dữ liệu để import');
  }

  const pool = await sql.connect(config);
  console.log(`[Import] Đã kết nối cơ sở dữ liệu. Bảng đích: [${targetTable}]`);

  // Transform rows
  const mappedRows = [];
  const invoiceSet = new Set();
  let totalAmount = 0;
  let minDate = null;
  let maxDate = null;

  for (let i = 0; i < rawRows.length; i++) {
    const r = rawRows[i];
    const sophieu = String(r['Sophieu'] || '').trim();
    if (!sophieu) continue;

    invoiceSet.add(sophieu);

    const stt = parseInt(r['STT'] || (i + 1), 10) || (i + 1);
    const transType = String(r['TransType'] || 'BAN').trim().toUpperCase();
    const isMua = transType === 'MUA';
    const isThu = transType === 'THU';
    const isChi = transType === 'CHI';

    // Primary key parts
    // stt_rec is 13 chars
    const stt_rec = sophieu.slice(0, 13).padEnd(13, ' ');
    const stt_rec0 = String(stt).padStart(3, '0').slice(-3);
    const fk_ctid = isMua ? 'PNA' : isThu ? 'PT1' : isChi ? 'PC1' : 'HDA';

    // Customer
    const rawTenKH = r['TenKH'];
    let doiTacName = cleanCustomerName(rawTenKH);
    if (/^[1-9]\d{8,9}$/.test(doiTacName)) {
      doiTacName = '0' + doiTacName;
    }
    let rawTel = String(r['Dienthoai'] || '').trim().replace(/\s+/g, '');
    if (rawTel && !rawTel.startsWith('0') && /^\d+$/.test(rawTel) && rawTel.length <= 11) {
      rawTel = '0' + rawTel;
    }
    const doiTacTel = rawTel.slice(0, 25);
    const doiTacAdd = String(r['Diachi'] || '').trim().slice(0, 300);
    const fk_doitacid = (doiTacTel || doiTacName || '').slice(0, 25);

    // Dates
    const dt = parseExcelDate(r['Ngay tao']);
    const ngay_ct = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
    const datetime0 = dt;

    if (!minDate || ngay_ct < minDate) minDate = ngay_ct;
    if (!maxDate || ngay_ct > maxDate) maxDate = ngay_ct;

    // Numbers & Money (in thousands in Excel -> x 1000)
    const canNang = Math.abs(parseFloat(r['CanNang']) || 0);
    const tuoiVang = parseFloat(r['TuoiVang']) || 0;
    const donGia = Math.abs(parseFloat(r['DonGia']) || 0) * 1000;
    const tienCong = Math.abs(parseFloat(r['TienCong']) || 0) * 1000;
    const tienDa = Math.abs(parseFloat(r['TienDa']) || 0) * 1000;

    let rawThanhTien = parseFloat(r['ThanhTien']) || 0;
    let tien = Math.abs(rawThanhTien) * 1000;
    if (isMua || isChi) {
      tien = -tien;
    }
    totalAmount += tien;

    const tlgAuUnit = canNang * (tuoiVang > 0 ? tuoiVang / 100 : 1);
    const tong_tlg = isMua ? -canNang : canNang;
    const tlg_au = isMua ? -tlgAuUnit : tlgAuUnit;

    const kieuCt = isMua ? 'KHÁCH BÁN' : isThu ? 'THU' : isChi ? 'CHI' : 'KHÁCH MUA';
    const quay = String(r['Quay'] || '').trim();
    const khoName = `Kho ${quay || 'Vàng'}`.slice(0, 250);
    const code = String(r['MaHang'] || '').trim().slice(0, 25);
    const vtName = String(r['TenHang'] || '').trim().slice(0, 250);
    const fk_dvtid = String(r['Donvitinh'] || 'Chỉ').trim().slice(0, 50);

    mappedRows.push([
      stt_rec,
      stt_rec0,
      fk_ctid,
      fk_doitacid,
      doiTacName,
      doiTacTel,
      doiTacAdd,
      '', // DoiTacCCCD
      ngay_ct,
      datetime0,
      sophieu.slice(0, 50),
      kieuCt,
      khoName,
      quay.slice(0, 350),
      code,
      code, // FK_VtID
      fk_dvtid,
      vtName,
      tuoiVang, // Hlg_au
      String(tuoiVang || ''), // Hlg_auK
      tlg_au,
      tong_tlg,
      tienCong,
      tienDa,
      donGia,
      tien,
      1, // so_luong
      '111', // FK_TkID
      'Tiền mặt', // TkName
      isMua ? 'Khách bán vàng' : 'Khách mua vàng', // Dien_giai
      '', // BpkdName (do not set counter as employee)
      null, // dateEdit
      null, // dateEdit2
      null, // dateEdit3
      '1', // status
      'EXCEL', // user_id0
      'EXCEL', // user_id2
    ]);
  }

  console.log(`[Import] Chuẩn hóa xong ${mappedRows.length} dòng. Bắt đầu đẩy dữ liệu theo lô 5,000 dòng...`);

  // Bulk insert in batches of 5,000
  const BATCH_SIZE = 5000;
  let insertedCount = 0;

  for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
    const chunk = mappedRows.slice(i, i + BATCH_SIZE);
    const table = createBulkTable(targetTable);

    for (const row of chunk) {
      table.rows.add(...row);
    }

    const req = pool.request();
    await req.bulk(table);
    insertedCount += chunk.length;
    const pct = Math.round((insertedCount / mappedRows.length) * 100);
    console.log(`[Import] Đã ghi ${insertedCount} / ${mappedRows.length} dòng (${pct}%)...`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[Import] Hoàn thành xuất sắc:
  - Bảng đích: ${targetTable}
  - Tổng dòng nhập: ${insertedCount}
  - Số hóa đơn: ${invoiceSet.size}
  - Tổng số tiền: ${totalAmount.toLocaleString('vi-VN')} đ
  - Từ ngày: ${minDate?.toISOString().slice(0, 10)} đến ngày: ${maxDate?.toISOString().slice(0, 10)}
  - Thời gian xử lý: ${duration}s`);

  await pool.close();

  return {
    success: true,
    totalRows: insertedCount,
    totalInvoices: invoiceSet.size,
    totalAmount,
    minDate: minDate?.toISOString().slice(0, 10),
    maxDate: maxDate?.toISOString().slice(0, 10),
    durationSeconds: parseFloat(duration),
  };
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('import-excel.mjs')) {
  const filePath = process.argv[2] || 'C:/Users/Nguyen Minh Hung/Downloads/data nam phong.xlsx';
  const targetTable = process.argv[3] || 'Vang_NamPhong';
  importExcelFile(filePath, targetTable)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Import Lỗi]', err);
      process.exit(1);
    });
}
