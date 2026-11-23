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

    const cacheKey = `${cleanTableName.toLowerCase()}:${whereSql}:${search || ''}:${startDate || ''}:${endDate || ''}:${kieuCt || ''}:${khoName || ''}:${maQuay || ''}:${status || ''}:${bpkdName || ''}`;

    let summary: any = null;
    const now = Date.now();
    const cachedEntry = summaryCache.get(cacheKey);
    if (cachedEntry && now - cachedEntry.timestamp < SUMMARY_CACHE_TTL) {
      summary = cachedEntry.summary;
    }

    let records: any[] = [];

    if (summary) {
      // Summary is cached: Execute ONLY the fast paginated query
      const pagedRes = await request.query(`
        SET NOCOUNT ON;
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

        SELECT *
        FROM [${cleanTableName}] WITH (NOLOCK)
        WHERE ${whereSql}
        ORDER BY ${safeSortBy} ${sortOrder}, stt_rec DESC
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY;
      `);
      records = pagedRes.recordset || [];
    } else {
      // Summary not cached: Run aggregate metrics + paginated records in 1 single non-blocking batch
      const combinedRes = await request.query(`
        SET NOCOUNT ON;
        SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

        -- 1. Aggregate Summary Metrics
        SELECT 
          COUNT(*) AS totalCount,
          SUM(CAST(ISNULL(tien, 0) AS float)) AS totalTien,
          SUM(CAST(ISNULL(Tong_tlg, 0) AS float)) AS totalTongTlg,
          SUM(CAST(ISNULL(Tlg_au, 0) AS float)) AS totalTlgAu,
          SUM(CAST(ISNULL(Tien_cong, 0) AS float)) AS totalTienCong,
          SUM(CAST(ISNULL(Tien_da, 0) AS float)) AS totalTienDa,
          SUM(CAST(ISNULL(so_luong, 0) AS float)) AS totalSoLuong
        FROM [${cleanTableName}] WITH (NOLOCK)
        WHERE ${whereSql};

        -- 2. Paginated Records
        SELECT *
        FROM [${cleanTableName}] WITH (NOLOCK)
        WHERE ${whereSql}
        ORDER BY ${safeSortBy} ${sortOrder}, stt_rec DESC
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

// POST: Add new transaction record
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const body = await req.json();
    const { tableName, record } = body;

    if (!tableName || !record) {
      return NextResponse.json({ error: 'Thiếu thông tin bảng hoặc bản ghi' }, { status: 400 });
    }

    const hasPermission = await checkTablePermission(session, tableName);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Không có quyền thao tác trên bảng này' }, { status: 403 });
    }

    const cleanTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    await ensureTransactionTableExists(cleanTableName);

    // Ensure fixed char lengths match SQL Server char(13) and char(3)
    const rawStt = record.stt_rec?.trim() || ('T' + Date.now().toString().slice(-8) + 'GLD');
    const stt_rec = rawStt.slice(0, 13).padEnd(13, ' ');
    const stt_rec0 = (record.stt_rec0?.trim() || '001').slice(0, 3).padEnd(3, ' ');
    const FK_CtID = (record.FK_CtID?.trim() || 'HD1').slice(0, 3).padEnd(3, ' ');

    const pool = await getDbPool();
    const insertReq = pool.request()
      .input('stt_rec', sql.Char(13), stt_rec)
      .input('stt_rec0', sql.Char(3), stt_rec0)
      .input('FK_CtID', sql.Char(3), FK_CtID)
      .input('FK_DoitacID', sql.VarChar(25), record.FK_DoitacID || null)
      .input('DoiTacName', sql.NVarChar(250), record.DoiTacName || null)
      .input('DoiTacTel', sql.VarChar(25), record.DoiTacTel || null)
      .input('DoiTacAdd', sql.NVarChar(300), record.DoiTacAdd || null)
      .input('DoiTacCCCD', sql.VarChar(25), record.DoiTacCCCD || null)
      .input('Ngay_ct', sql.SmallDateTime, record.Ngay_ct || new Date())
      .input('datetime0', sql.DateTime, record.datetime0 || new Date())
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
      .input('FK_TkID', sql.VarChar(25), record.FK_TkID || null)
      .input('TkName', sql.NVarChar(250), record.TkName || null)
      .input('Dien_giai', sql.NVarChar(350), record.Dien_giai || null)
      .input('BpkdName', sql.NVarChar(250), record.BpkdName || null)
      .input('status', sql.VarChar(50), record.status || '1')
      .input('user_id0', sql.VarChar(25), session.username)
      .input('user_id2', sql.VarChar(25), session.username);

    await insertReq.query(`
      INSERT INTO [${cleanTableName}] (
        stt_rec, stt_rec0, FK_CtID, FK_DoitacID, DoiTacName, DoiTacTel, DoiTacAdd, DoiTacCCCD,
        Ngay_ct, datetime0, So_ct, KieuCt, KhoName, maQuay, code, FK_VtID, FK_DvtID, VtName,
        Hlg_au, Hlg_auK, Tlg_au, Tong_tlg, Tien_cong, Tien_da, gia_au, tien, so_luong,
        FK_TkID, TkName, Dien_giai, BpkdName, status, user_id0, user_id2
      ) VALUES (
        @stt_rec, @stt_rec0, @FK_CtID, @FK_DoitacID, @DoiTacName, @DoiTacTel, @DoiTacAdd, @DoiTacCCCD,
        @Ngay_ct, @datetime0, @So_ct, @KieuCt, @KhoName, @maQuay, @code, @FK_VtID, @FK_DvtID, @VtName,
        @Hlg_au, @Hlg_auK, @Tlg_au, @Tong_tlg, @Tien_cong, @Tien_da, @gia_au, @tien, @so_luong,
        @FK_TkID, @TkName, @Dien_giai, @BpkdName, @status, @user_id0, @user_id2
      )
    `);

    invalidateSummaryCache(cleanTableName);

    return NextResponse.json({ success: true, message: 'Thêm giao dịch thành công' }, { status: 201 });
  } catch (error: any) {
    logger.error('InsertTransaction', error);
    return NextResponse.json({ error: getSafeErrorMessage(error, 'Lỗi thêm giao dịch mới') }, { status: 500 });
  }
}
