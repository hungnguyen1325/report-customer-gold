import { NextRequest, NextResponse } from 'next/server';
import { getSession, comparePassword, hashPassword } from '@/lib/auth';
import { getDbPool, sql } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu mới phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Xác nhận mật khẩu mới không khớp' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' },
        { status: 400 }
      );
    }

    const pool = await getDbPool();

    // Fetch user current hashed password
    const userRes = await pool.request()
      .input('id', sql.BigInt, session.id)
      .query(`SELECT password FROM accounts WHERE id = @id`);

    if (userRes.recordset.length === 0) {
      return NextResponse.json({ error: 'Tài khoản không tồn tại' }, { status: 404 });
    }

    const currentHash = userRes.recordset[0].password;
    const isCurrentValid = await comparePassword(currentPassword, currentHash);

    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Mật khẩu hiện tại không chính xác' },
        { status: 400 }
      );
    }

    // Hash new password and update
    const newHash = await hashPassword(newPassword);
    await pool.request()
      .input('id', sql.BigInt, session.id)
      .input('password', sql.NVarChar, newHash)
      .query(`
        UPDATE accounts 
        SET password = @password, update_at = GETDATE() 
        WHERE id = @id
      `);

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Lỗi đổi mật khẩu: ' + error.message },
      { status: 500 }
    );
  }
}
