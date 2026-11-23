import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Đăng xuất thành công' });
  response.cookies.set('gold_auth_token', '', {
    httpOnly: true,
    path: '/',
    expires: new Date(0),
  });
  return response;
}
