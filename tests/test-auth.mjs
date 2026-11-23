import { hashPassword, comparePassword, signToken, verifyToken } from '../src/lib/auth.js';
import { getDbPool } from '../src/lib/db.js';

// Simple sanity check of auth logic
async function testAuthLogic() {
  console.log('Testing password hashing...');
  const hash = await hashPassword('admin123');
  const valid = await comparePassword('admin123', hash);
  const invalid = await comparePassword('wrongpass', hash);
  console.log('Hash test:', { valid, invalid });

  console.log('Testing JWT token...');
  const token = signToken({ id: 1, username: 'admin', role: 'admin' });
  const payload = verifyToken(token);
  console.log('Token test:', { validToken: !!payload, username: payload?.username });
}

testAuthLogic().catch(console.error);
