import { NextRequest, NextResponse } from 'next/server';
import { getDbPool, sql } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { logger, getSafeErrorMessage } from '@/lib/logger';

// In-memory rate limiting for brute-force protection
interface LoginAttempt {
  count: number;
  lockedUntil: number;
}
const loginAttempts = new Map<string, LoginAttempt>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
    const now = Date.now();

    const attempt = loginAttempts.get(ip);
    if (attempt && attempt.lockedUntil > now) {
      const waitSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
      return NextResponse.json(
        { error: `Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${waitSeconds} giây.` },
        { status: 429 }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên đăng nhập và mật khẩu' },
        { status: 400 }
      );
    }

    const pool = await getDbPool();
    const result = await pool.request()
      .input('username', sql.VarChar, username.trim())
      .query(`
        SELECT id, username, password, full_name, role, active 
        FROM accounts 
        WHERE username = @username
      `);

    const recordFailedAttempt = () => {
      const cur = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
      cur.count += 1;
      if (cur.count >= 5) {
        cur.lockedUntil = now + 5 * 60 * 1000; // Lock for 5 minutes
      }
      loginAttempts.set(ip, cur);
    };

    if (result.recordset.length === 0) {
      recordFailedAttempt();
      return NextResponse.json(
        { error: 'Tài khoản hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    const user = result.recordset[0];

    if (!user.active) {
      return NextResponse.json(
        { error: 'Tài khoản này đã bị khóa. Vui lòng liên hệ quản trị viên.' },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      recordFailedAttempt();
      return NextResponse.json(
        { error: 'Tài khoản hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Reset failed attempts on success
    loginAttempts.delete(ip);

    const token = signToken({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    });

    response.cookies.set('gold_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    logger.error('Login', error);
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'Lỗi hệ thống khi đăng nhập. Vui lòng thử lại sau.') },
      { status: 500 }
    );
  }
}
