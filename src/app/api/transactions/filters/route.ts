import { NextRequest, NextResponse } from 'next/server';
import { getSession, checkTablePermission } from '@/lib/auth';
import { getDbPool, ensureTransactionTableExists } from '@/lib/db';

// In-memory cache for table distinct filter values (2 minutes TTL)
const filterOptionsCache = new Map<string, { data: any; timestamp: number }>();
const FILTER_CACHE_TTL = 120000; // 2 minutes

export function invalidateFilterCache(tableName?: string) {
  if (!tableName) {
    filterOptionsCache.clear();
  } else {
    filterOptionsCache.delete(tableName.toLowerCase());
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
      return NextResponse.json({ error: 'Không có quyền truy cập bảng này' }, { status: 403 });
    }

    const cleanTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    const cacheKey = cleanTableName.toLowerCase();
    const now = Date.now();

    // Fast-path: Return cached filter lists
    const cached = filterOptionsCache.get(cacheKey);
    if (cached && now - cached.timestamp < FILTER_CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    await ensureTransactionTableExists(cleanTableName);
    const pool = await getDbPool();

    // Combined single-batch query with READ UNCOMMITTED & NOLOCK to prevent locking
    const batchRes = await pool.request().query(`
      SET NOCOUNT ON;
      SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

      SELECT DISTINCT KieuCt 
      FROM [${cleanTableName}] WITH (NOLOCK)
      WHERE KieuCt IS NOT NULL AND LTRIM(RTRIM(KieuCt)) <> '' 
      ORDER BY KieuCt ASC;

      SELECT DISTINCT KhoName 
      FROM [${cleanTableName}] WITH (NOLOCK)
      WHERE KhoName IS NOT NULL AND LTRIM(RTRIM(KhoName)) <> '' 
      ORDER BY KhoName ASC;

      SELECT DISTINCT maQuay 
      FROM [${cleanTableName}] WITH (NOLOCK)
      WHERE maQuay IS NOT NULL AND LTRIM(RTRIM(maQuay)) <> '' 
      ORDER BY maQuay ASC;

      SELECT DISTINCT BpkdName 
      FROM [${cleanTableName}] WITH (NOLOCK)
      WHERE BpkdName IS NOT NULL AND LTRIM(RTRIM(BpkdName)) <> '' 
      ORDER BY BpkdName ASC;
    `);

    const recordsets = batchRes.recordsets as any[];
    const maQuayList: string[] = (recordsets[2] || []).map((r: any) => r.maQuay?.trim()).filter(Boolean);
    const quaySet = new Set(maQuayList.map((q) => q.toLowerCase()));

    // Filter real employees: exclude counter codes and technical labels
    const bpkdRaw: string[] = (recordsets[3] || []).map((r: any) => r.BpkdName?.trim()).filter(Boolean);
    const nhanVienList = bpkdRaw
      .filter((name) => {
        const lower = name.toLowerCase();
        return lower !== 'excel' && lower !== 'hivi' && !quaySet.has(lower);
      })
      .sort((a, b) => a.localeCompare(b, 'vi'));

    const result = {
      kieuCtList: (recordsets[0] || []).map((r: any) => r.KieuCt),
      khoNameList: (recordsets[1] || []).map((r: any) => r.KhoName),
      maQuayList,
      bpkdNameList: nhanVienList,
    };

    filterOptionsCache.set(cacheKey, { data: result, timestamp: now });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
