/**
 * MailRite — Environment Configuration
 * 
 * Central config that validates required env vars at startup.
 * Fails fast if critical config is missing.
 */

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

// Coral — SQL Query Layer
export const CORAL_BINARY_PATH = process.env.CORAL_BINARY_PATH || 'coral';
export const CORAL_QUERY_TIMEOUT = parseInt(process.env.CORAL_QUERY_TIMEOUT || '30000');

// App
export const APP_URL = process.env.APP_URL || 'http://localhost:3000';
export const PORT = parseInt(process.env.PORT || '3000');

// Validation
export function validateConfig(): string[] {
  const errors: string[] = [];
  
  if (X402_STRICT && !BASE_PAYMENT_ROUTER_ADDRESS) {
    errors.push('BASE_PAYMENT_ROUTER_ADDRESS required when X402_STRICT=true');
  }
  
  if (!SMTP_HOST) {
    errors.push('SMTP_HOST must be configured for email');
  }
  
  return errors;
}

export function getCoralConfig() {
  return {
    binaryPath: CORAL_BINARY_PATH,
    timeout: CORAL_QUERY_TIMEOUT,
  };
}
