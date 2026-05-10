/**
 * MailRite — User Authentication
 * 
 * Email/password signup + login with JWT tokens.
 * Uses SQLite (better-sqlite3) for user storage.
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Database from 'better-sqlite3';

// ─── Database Setup ───────────────────────────────────────────────────────────
const db = new Database(':memory:');  // Use file path for persistence in production
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    wallet_address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ─── Password Helpers ─────────────────────────────────────────────────────────
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const passwordSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, passwordSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: passwordSalt };
}

function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  return hash === storedHash;
}

// ─── Token Helpers ────────────────────────────────────────────────────────────
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateUserId(): string {
  return `user_${crypto.randomBytes(12).toString('hex')}`;
}

// ─── Validation ───────────────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// ─── Middleware ────────────────────────────────────────────────────────────────
export function requireAuth(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '') || req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const session = db.prepare(
    'SELECT s.*, u.id as user_id, u.email, u.name, u.wallet_address FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime(\'now\')'
  ).get(token) as any;
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  
  (req as any).user = {
    id: session.user_id,
    email: session.email,
    name: session.name,
    walletAddress: session.wallet_address,
  };
  
  next();
}

// ─── Routes ───────────────────────────────────────────────────────────────────
export const authRouter = Router();

// POST /api/auth/signup
authRouter.post('/signup', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  
  // Validate
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }
  
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  
  // Check if user exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  
  // Create user
  const userId = generateUserId();
  const { hash, salt } = hashPassword(password);
  
  try {
    db.prepare(
      'INSERT INTO users (id, email, name, password_hash, password_salt) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, email.toLowerCase(), name.trim(), hash, salt);
    
    // Create session
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    
    db.prepare(
      'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)'
    ).run(token, userId, expiresAt);
    
    res.json({
      success: true,
      user: { id: userId, email: email.toLowerCase(), name: name.trim() },
      token,
    });
  } catch (error) {
    console.error('[Auth] Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const user = db.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).get(email.toLowerCase()) as any;
  
  if (!user || !verifyPassword(password, user.password_hash, user.password_salt)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  // Create session
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  db.prepare(
    'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)'
  ).run(token, user.id, expiresAt);
  
  res.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, walletAddress: user.wallet_address },
    token,
  });
});

// POST /api/auth/logout
authRouter.post('/logout', requireAuth, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  
  res.json({ success: true });
});

// GET /api/auth/me — Get current user
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

// PUT /api/auth/wallet — Link wallet address
authRouter.put('/wallet', requireAuth, (req: Request, res: Response) => {
  const { walletAddress } = req.body;
  const userId = (req as any).user.id;
  
  if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }
  
  db.prepare('UPDATE users SET wallet_address = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(walletAddress.toLowerCase(), userId);
  
  res.json({ success: true, walletAddress: walletAddress.toLowerCase() });
});
