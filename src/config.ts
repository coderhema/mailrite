/**
 * MailRite — Environment Configuration
 * 
 * Central config that validates required env vars at startup.
 * Fails fast if critical config is missing.
 */

// Required
export const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY!;

// Base Chain
export const BASE_CHAIN_ID = parseInt(process.env.BASE_CHAIN_ID || '8453');
export const BASE_PAYMENT_ROUTER_ADDRESS = process.env.BASE_PAYMENT_ROUTER_ADDRESS || '';
export const X402_SEND_FEE_WEI = BigInt(process.env.X402_SEND_FEE_WEI || '1000000000000');
export const X402_STRICT = process.env.X402_STRICT === 'true';

// Poke API (optional)
export const POKE_API_BASE_URL = process.env.POKE_API_BASE_URL || '';
export const POKE_API_KEY = process.env.POKE_API_KEY || '';
export const POKE_API_PATH = process.env.POKE_API_PATH || '';

// SMTP (fallback)
export const SMTP_HOST = process.env.SMTP_HOST || '';
export const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASS = process.env.SMTP_PASS || '';
export const SMTP_FROM = process.env.SMTP_FROM || '';

// App
export const APP_URL = process.env.APP_URL || 'http://localhost:3000';
export const PORT = parseInt(process.env.PORT || '3000');

// Validation
export function validateConfig(): string[] {
  const errors: string[] = [];
  
  if (!COMPOSIO_API_KEY) {
    errors.push('COMPOSIO_API_KEY is required for social auth');
  }
  
  if (X402_STRICT && !BASE_PAYMENT_ROUTER_ADDRESS) {
    errors.push('BASE_PAYMENT_ROUTER_ADDRESS required when X402_STRICT=true');
  }
  
  if (!SMTP_HOST && !COMPOSIO_API_KEY) {
    errors.push('Either SMTP_HOST or COMPOSIO_API_KEY must be configured for email');
  }
  
  return errors;
}
