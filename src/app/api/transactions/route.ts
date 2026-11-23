import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkTablePermission } from '@/lib/auth';
import { getDbPool, sql, ensureTransactionTableExists } from '@/lib/db';
import { logger, getSafeErrorMessage } from '@/lib/logger';

// In-memory cache for aggregate summary metrics (20s TTL)
interface SummaryCacheEntry {
  summary: any;
  timestamp: number;
}
const summaryCache = new Map<string, SummaryCacheEntry>();
const SUMMARY_CACHE_TTL = 20000;

export function invalidateSummaryCache(tableName?: string) {
  if (!tableName) {
    summaryCache.clear();
  } else {
    const prefix = `${tableName.toLowerCase()}:`;
    for (const key of summaryCache.keys()) {
      if (key.startsWith(prefix)) {
        summaryCache.delete(key);
      }
    }
  }
}

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
      return NextResponse.json({ error: 'Bạn không có quyền truy cập bảng này' }, { status: 403 });
    }

    const cleanTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    await ensureTransactionTableExists(cleanTableName);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10)));
    const offset = (page - 1) * pageSize;

    const search = searchParams.get('search')?.trim();
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const kieuCt = searchParams.get('kieuCt')?.trim();
    const khoName = searchParams.get('khoName')?.trim();
    const maQuay = searchParams.get('maQuay')?.trim();
    const status = searchParams.get('status')?.trim();
    const bpkdName = searchParams.get('bpkdName')?.trim();
    const sortBy = searchParams.get('sortBy') || 'Ngay_ct';
    const sortOrder = searchParams.get('sortOrder')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Allowed sort columns
    const allowedSortCols = ['Ngay_ct', 'datetime0', 'stt_rec', 'So_ct', 'DoiTacName', 'tien', 'Tong_tlg', 'Tlg_au'];
    const safeSortBy = allowedSortCols.includes(sortBy) ? sortBy : 'Ngay_ct';

    // Build WHERE clauses
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
      // Include whole end date
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

    const whereSql = whereClauses.join(' AND ');

    request.input('offset', sql.Int, offset);
    request.input('pageSize', sql.Int, pageSize);

    const sortExpression = safeSortBy === 'tien' ? 'SUM(CAST(ISNULL(tien, 0) AS float))'
      : safeSortBy === 'Tong_tlg' ? 'SUM(CAST(ISNULL(Tong_tlg, 0) AS float))'
      : safeSortBy === 'Tlg_au' ? 'SUM(CAST(ISNULL(Tlg_au, 0) AS float))'
      : safeSortBy === 'So_ct' ? 'MAX(So_ct)'
      : safeSortBy === 'datetime0' ? 'MAX(datetime0)'
      : 'MAX(Ngay_ct)';

    const cacheKey = `${cleanTableName.toLowerCase()}:${whereSql}:${search || ''}:${startDate || ''}:${endDate || ''}:${kieuCt || ''}:${khoName || ''}:${maQuay || ''}:${status || ''}:${bpkdName || ''}:${safeSortBy}:${sortOrder}`;

    let summary: any = null;
    const now = Date.now();
    const cachedEntry = summaryCache.get(cacheKey);
    if (cachedEntry && now - cachedEntry.timestamp < SUMMARY_CACHE_TTL) {
      summary = cachedEntry.summary;
    }

    let records: any[] = [];

    if (summary) {
      // Summary is cached: Execute ONLY the fast paginated grouped invoice query
      const pagedRes = await request.query(`
        SET NOCOUNT ON;
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

        SELECT 
          stt_rec,
          MAX(stt_rec0) AS stt_rec0,
          MAX(FK_CtID) AS FK_CtID,
          MAX(So_ct) AS So_ct,
          MAX(Ngay_ct) AS Ngay_ct,
          MAX(datetime0) AS datetime0,
          MAX(KieuCt) AS KieuCt,
          MAX(KhoName) AS KhoName,
          MAX(maQuay) AS maQuay,
          MAX(DoiTacName) AS DoiTacName,
          MAX(DoiTacTel) AS DoiTacTel,
          MAX(DoiTacCCCD) AS DoiTacCCCD,
          MAX(DoiTacAdd) AS DoiTacAdd,
          MAX(FK_DoitacID) AS FK_DoitacID,
          MAX(BpkdName) AS BpkdName,
          MAX(TkName) AS TkName,
          MAX(status) AS status,
          MAX(user_id0) AS user_id0,
          COUNT(*) AS item_count,
          STRING_AGG(CAST(ISNULL(VtName, '') AS nvarchar(max)), ', ') AS VtName,
          STRING_AGG(CAST(ISNULL(code, '') AS nvarchar(max)), ', ') AS code,
          SUM(CAST(ISNULL(tien, 0) AS float)) AS tien,
          SUM(CAST(ISNULL(Tong_tlg, 0) AS float)) AS Tong_tlg,
          SUM(CAST(ISNULL(Tlg_au, 0) AS float)) AS Tlg_au,
          SUM(CAST(ISNULL(Tien_cong, 0) AS float)) AS Tien_cong,
          SUM(CAST(ISNULL(Tien_da, 0) AS float)) AS Tien_da,
          SUM(CAST(ISNULL(so_luong, 0) AS float)) AS so_luong
        FROM [${cleanTableName}] WITH (NOLOCK)
        WHERE ${whereSql}
        GROUP BY stt_rec
        ORDER BY ${sortExpression} ${sortOrder}, stt_rec DESC
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY;
      `);
      records = pagedRes.recordset || [];
    } else {
      // Summary not cached: Run aggregate metrics + paginated records in 1 single non-blocking batch
      const combinedRes = await request.query(`
        SET NOCOUNT ON;
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

        -- 1. Aggregate Summary Metrics (Grouped distinct invoices & total sums)
        SELECT 
          COUNT(DISTINCT stt_rec) AS totalCount,
          SUM(CAST(ISNULL(tien, 0) AS float)) AS totalTien,
          SUM(CAST(ISNULL(Tong_tlg, 0) AS float)) AS totalTongTlg,
          SUM(CAST(ISNULL(Tlg_au, 0) AS float)) AS totalTlgAu,
          SUM(CAST(ISNULL(Tien_cong, 0) AS float)) AS totalTienCong,
          SUM(CAST(ISNULL(Tien_da, 0) AS float)) AS totalTienDa,
          SUM(CAST(ISNULL(so_luong, 0) AS float)) AS totalSoLuong
        FROM [${cleanTableName}] WITH (NOLOCK)
        WHERE ${whereSql};

        -- 2. Paginated Grouped Invoices
        SELECT 
          stt_rec,
          MAX(stt_rec0) AS stt_rec0,
          MAX(FK_CtID) AS FK_CtID,
          MAX(So_ct) AS So_ct,
          MAX(Ngay_ct) AS Ngay_ct,
          MAX(datetime0) AS datetime0,
          MAX(KieuCt) AS KieuCt,
          MAX(KhoName) AS KhoName,
          MAX(maQuay) AS maQuay,
          MAX(DoiTacName) AS DoiTacName,
          MAX(DoiTacTel) AS DoiTacTel,
          MAX(DoiTacCCCD) AS DoiTacCCCD,
          MAX(DoiTacAdd) AS DoiTacAdd,
          MAX(FK_DoitacID) AS FK_DoitacID,
          MAX(BpkdName) AS BpkdName,
          MAX(TkName) AS TkName,
          MAX(status) AS status,
          MAX(user_id0) AS user_id0,
          COUNT(*) AS item_count,
          STRING_AGG(CAST(ISNULL(VtName, '') AS nvarchar(max)), ', ') AS VtName,
          STRING_AGG(CAST(ISNULL(code, '') AS nvarchar(max)), ', ') AS code,
          SUM(CAST(ISNULL(tien, 0) AS float)) AS tien,
          SUM(CAST(ISNULL(Tong_tlg, 0) AS float)) AS Tong_tlg,
          SUM(CAST(ISNULL(Tlg_au, 0) AS float)) AS Tlg_au,
          SUM(CAST(ISNULL(Tien_cong, 0) AS float)) AS Tien_cong,
          SUM(CAST(ISNULL(Tien_da, 0) AS float)) AS Tien_da,
          SUM(CAST(ISNULL(so_luong, 0) AS float)) AS so_luong
        FROM [${cleanTableName}] WITH (NOLOCK)
        WHERE ${whereSql}
        GROUP BY stt_rec
        ORDER BY ${sortExpression} ${sortOrder}, stt_rec DESC
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY;
      `);

      const recordsets = combinedRes.recordsets as any[];
      const rawSummary = recordsets[0]?.[0] || {};
      records = recordsets[1] || [];

      summary = {
        totalCount: rawSummary.totalCount || 0,
        totalTien: rawSummary.totalTien || 0,
        totalTongTlg: rawSummary.totalTongTlg || 0,
        totalTlgAu: rawSummary.totalTlgAu || 0,
        totalTienCong: rawSummary.totalTienCong || 0,
        totalTienDa: rawSummary.totalTienDa || 0,
        totalSoLuong: rawSummary.totalSoLuong || 0,
      };

      summaryCache.set(cacheKey, { summary, timestamp: now });
    }

    const totalCount = summary.totalCount || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      records,
      pagination: {
        page,
        pageSize,
        totalRecords: totalCount,
        totalPages,
      },
      summary,
    });
  } catch (error: any) {
    logger.error('FetchTransactions', error);
    return NextResponse.json({ error: getSafeErrorMessage(error, 'Lỗi tải danh sách giao dịch') }, { status: 500 });
  }
}

// POST: Add new transaction record (Disabled - Read-only reporting system)
export async function POST() {
  return NextResponse.json(
    { error: 'Hệ thống ở chế độ chỉ xem báo cáo. Không cho phép tạo mới hoặc chỉnh sửa hóa đơn.' },
    { status: 403 }
  );
}
