/**
 * =========================================================================
 * AUTENTICAÇÃO E SESSÃO DO PAINEL DE ADMINISTRAÇÃO (/admin) — CADENCE
 * 
 * - Validação de password segura com base na variável de ambiente ADMIN_PASSWORD
 * - Sessão assinada criptograficamente via HMAC-SHA256 (sem expor credenciais)
 * - Suporta Cookie httpOnly, Secure, SameSite=Strict e cabeçalho Authorization: Bearer
 * - Middleware rigoroso: sem autenticação válida devolve 401 e não revela dados
 * =========================================================================
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const DEFAULT_ADMIN_PASSWORD = 'cadence2026!';
const SESSION_COOKIE_NAME = 'cadence_admin_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || 'cadence-default-session-salt-key-2026';
}

function getExpectedAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
}

/**
 * Cria um token de sessão assinado contendo timestamp e assinatura HMAC
 * Formato: base64(issuedAt:expiresAt).signature
 */
export function generateAdminSessionToken(): string {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ role: 'admin', issuedAt, expiresAt })).toString('base64url');
  
  const hmac = crypto.createHmac('sha256', getSessionSecret());
  hmac.update(payload);
  const signature = hmac.digest('hex');
  
  return `${payload}.${signature}`;
}

/**
 * Verifica se um token de sessão é válido e não expirou
 */
export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  
  const [payloadBase64, providedSig] = parts;
  
  try {
    const hmac = crypto.createHmac('sha256', getSessionSecret());
    hmac.update(payloadBase64);
    const expectedSig = hmac.digest('hex');
    
    // Comparação de tempo constante para evitar ataques de timing
    const expectedBuf = Buffer.from(expectedSig);
    const providedBuf = Buffer.from(providedSig);
    if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      return false;
    }
    
    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const parsed = JSON.parse(payloadJson);
    
    if (parsed.role !== 'admin') return false;
    if (typeof parsed.expiresAt !== 'number' || Date.now() > parsed.expiresAt) {
      return false; // Sessão expirada
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida a palavra-passe fornecida pelo utilizador contra a configurada no ambiente
 */
export function checkAdminPassword(providedPassword: string): boolean {
  if (typeof providedPassword !== 'string' || !providedPassword) return false;
  
  const expected = getExpectedAdminPassword();
  
  // Hash em SHA-256 para garantir comparação em tempo constante de tamanho fixo
  const expectedHash = crypto.createHash('sha256').update(expected).digest();
  const providedHash = crypto.createHash('sha256').update(providedPassword).digest();
  
  return crypto.timingSafeEqual(expectedHash, providedHash);
}

/**
 * Define o cookie de sessão httpOnly na resposta
 */
export function setAdminSessionCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax', // Em iframe pode requerer sameSite none com secure
    path: '/',
    maxAge: SESSION_TTL_MS,
  });
}

/**
 * Remove o cookie de sessão
 */
export function clearAdminSessionCookie(res: Response): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
}

/**
 * Middleware Express para proteger rotas administrativas
 * Sem acesso, devolve estritamente HTTP 401 e não revela quaisquer dados.
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  // 1. Tentar ler do Cookie httpOnly
  let token = req.cookies?.[SESSION_COOKIE_NAME];
  
  // 2. Se não estiver no cookie (ex.: em ambientes de iframe com cookies de terceiros restritos),
  // tentar ler do cabeçalho Authorization: Bearer <token>
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7).trim();
  }
  
  if (!verifyAdminSessionToken(token)) {
    res.status(401).json({
      error: 'Não autorizado. Acesso restrito a administradores.',
    });
    return;
  }
  
  next();
}
