import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { getDbPool, sql } from './db';
import { UserSession } from './types';

if (!process.env.JWT_SECRET) {
  throw new Error('Thiếu cấu hình biến môi trường JWT_SECRET trong file .env');
}
const JWT_SECRET: string = process.env.JWT_SECRET;

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: Omit<UserSession, 'allowedTables'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export async function getSession(req?: NextRequest): Promise<UserSession | null> {
  let token: string | undefined;

  if (req) {
    // 1. From Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    // 2. From Cookies
    if (!token) {
      token = req.cookies.get('gold_auth_token')?.value;
    }
  }

  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return null;
  }

  // Fetch latest active status and permissions from DB in a single batch
  const pool = await getDbPool();
  const multiRes = await pool.request()
    .input('id', sql.BigInt, decoded.id)
    .query(`
      SET NOCOUNT ON;
      SELECT id, username, full_name, role, active 
      FROM accounts WITH (NOLOCK) 
      WHERE id = @id;

      SELECT fk_data_table_id 
      FROM account_data WITH (NOLOCK) 
      WHERE fk_accountid = @id;
    `);

  const recordsets = multiRes.recordsets as any[];
  const userRes = recordsets[0];
  if (!userRes || userRes.length === 0) {
    return null;
  }

  const user = userRes[0];
  if (!user.active) {
    return null;
  }

  // Get allowed table IDs
  let allowedTables: number[] = [];
  if (user.role === 'admin') {
    // Admin has access to all tables
    allowedTables = Array.from(tableRegistryCache.values());
  } else {
    allowedTables = (recordsets[1] || []).map((r: any) => r.fk_data_table_id);
  }

  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    allowedTables,
  };
}

// In-memory cache for registered data tables
const tableRegistryCache = new Map<string, number>();
let lastRegistryCacheTime = 0;
const REGISTRY_CACHE_TTL = 60000; // 60 seconds

async function getRegisteredTableId(tableName: string): Promise<number | null> {
  const cleanName = tableName.trim().toLowerCase();
  const now = Date.now();

  if (tableRegistryCache.has(cleanName) && now - lastRegistryCacheTime < REGISTRY_CACHE_TTL) {
    return tableRegistryCache.get(cleanName)!;
  }

  const pool = await getDbPool();
  const res = await pool.request().query(`
    SET NOCOUNT ON;
    SELECT id, name FROM data_table WITH (NOLOCK)
  `);

  tableRegistryCache.clear();
  for (const r of res.recordset) {
    tableRegistryCache.set(r.name.trim().toLowerCase(), r.id);
  }
  lastRegistryCacheTime = now;

  return tableRegistryCache.get(cleanName) ?? null;
}

export async function checkTablePermission(session: UserSession, tableName: string): Promise<boolean> {
  const tableId = await getRegisteredTableId(tableName);
  if (!tableId) return false;

  // Admin has access to all registered tables
  if (session.role === 'admin') return true;

  return session.allowedTables.includes(tableId);
}
