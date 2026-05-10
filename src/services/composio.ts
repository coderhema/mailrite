/**
 * MailRite — Composio Social Auth Integration
 * 
 * Handles OAuth for LinkedIn, Gmail, Twitter, Instagram, Facebook, etc.
 * Composio manages token storage, refresh, and scoped permissions.
 */

import { Composio } from '@composio/sdk';
import type { Request, Response } from 'express';

// ─── Initialize Composio ──────────────────────────────────────────────────────
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY!,
});

// ─── Supported Social Sources ─────────────────────────────────────────────────
export const SUPPORTED_SOURCES = {
  linkedin: {
    toolkit: 'LINKEDIN',
    actions: [
      'LINKEDIN_LIST_CONNECTIONS',
      'LINKEDIN_GET_PROFILE',
      'LINKEDIN_SEARCH_PEOPLE',
    ],
  },
  gmail: {
    toolkit: 'GMAIL',
    actions: [
      'GMAIL_LIST_CONTACTS',
      'GMAIL_LIST_EMAILS',
      'GMAIL_SEND_EMAIL',
    ],
  },
  twitter: {
    toolkit: 'TWITTER',
    actions: [
      'TWITTER_LIST_FOLLOWERS',
      'TWITTER_GET_USER_BY_USERNAME',
      'TWITTER_SEARCH Tweets',
    ],
  },
  instagram: {
    toolkit: 'INSTAGRAM',
    actions: [
      'INSTAGRAM_LIST_FOLLOWERS',
      'INSTAGRAM_GET_USER_INFO',
    ],
  },
  facebook: {
    toolkit: 'FACEBOOK_MARKETING',
    actions: [
      'FACEBOOK_LIST_ADS_ACCOUNTS',
      'FACEBOOK_GET_USER_INFO',
    ],
  },
} as const;

export type SocialSource = keyof typeof SUPPORTED_SOURCES;

// ─── Generate Connect Link ────────────────────────────────────────────────────
/**
 * Creates a Composio Connect Link for user-facing OAuth.
 * User opens this URL → authenticates → redirected back to your callback.
 */
export async function generateConnectLink(
  sourceId: SocialSource,
  userId: string,
  redirectUri: string
): Promise<string> {
  const toolkit = SUPPORTED_SOURCES[sourceId]?.toolkit;
  if (!toolkit) throw new Error(`Unsupported source: ${sourceId}`);

  const connectionRequest = await composio.toolkits.authorize(
    userId,
    toolkit
  );

  // Composio returns a hosted auth page URL
  return connectionRequest.redirectUrl;
}

// ─── Check Connection Status ──────────────────────────────────────────────────
export async function isConnected(
  userId: string,
  sourceId: SocialSource
): Promise<boolean> {
  const toolkit = SUPPORTED_SOURCES[sourceId]?.toolkit;
  if (!toolkit) return false;

  const connections = await composio.connectedAccounts.list({
    userIds: [userId],
    toolkitSlug: toolkit,
  });

  return connections.items.length > 0 && 
    connections.items[0].status === 'ACTIVE';
}

// ─── Get Connected Account ────────────────────────────────────────────────────
export async function getConnectedAccount(
  userId: string,
  sourceId: SocialSource
) {
  const toolkit = SUPPORTED_SOURCES[sourceId]?.toolkit;
  if (!toolkit) throw new Error(`Unsupported source: ${sourceId}`);

  const connections = await composio.connectedAccounts.list({
    userIds: [userId],
    toolkitSlug: toolkit,
  });

  if (connections.items.length === 0) {
    throw new Error(`No connected account for ${sourceId}`);
  }

  return connections.items[0];
}

// ─── Fetch Contacts via Composio ──────────────────────────────────────────────
/**
 * Fetches contacts from a connected social source.
 * Uses Composio's tool execution with the user's OAuth tokens.
 */
export async function fetchContacts(
  userId: string,
  sourceId: SocialSource
): Promise<any[]> {
  const account = await getConnectedAccount(userId, sourceId);
  const source = SUPPORTED_SOURCES[sourceId];

  // Execute the appropriate contact-fetching action
  const listAction = source.actions.find(a => 
    a.includes('LIST') || a.includes('FOLLOWERS') || a.includes('CONNECTIONS')
  );

  if (!listAction) return [];

  const result = await composio.tools.execute(
    listAction,
    {
      connectedAccountId: account.id,
      userId,
    }
  );

  return result.data ?? [];
}

// ─── Send Email via Gmail (Composio) ─────────────────────────────────────────
export async function sendEmailViaGmail(
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; messageId?: string }> {
  const result = await composio.tools.execute(
    'GMAIL_SEND_EMAIL',
    {
      userId,
      to,
      subject,
      body,
    }
  );

  return {
    success: result.successful ?? false,
    messageId: result.data?.messageId,
  };
}

// ─── Express Routes ───────────────────────────────────────────────────────────
export function registerAuthRoutes(app: any) {
  // Generate OAuth URL
  app.get('/api/auth/url', async (req: Request, res: Response) => {
    const { sourceId, userId = 'default-user' } = req.query;

    try {
      const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/callback`;
      const url = await generateConnectLink(
        sourceId as SocialSource,
        userId as string,
        redirectUri
      );
      res.json({ url });
    } catch (error) {
      console.error('Auth URL generation failed:', error);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  });

  // Check connection status
  app.get('/api/auth/status', async (req: Request, res: Response) => {
    const { sourceId, userId = 'default-user' } = req.query;

    try {
      const connected = await isConnected(
        userId as string,
        sourceId as SocialSource
      );
      res.json({ connected });
    } catch (error) {
      res.json({ connected: false });
    }
  });

  // Get all connected sources
  app.get('/api/auth/connections', async (req: Request, res: Response) => {
    const { userId = 'default-user' } = req.query;

    try {
      const connections = await composio.connectedAccounts.list({
        userIds: [userId as string],
      });

      const sources = connections.items.map(c => ({
        source: c.toolkitSlug.toLowerCase(),
        status: c.status,
        connectedAt: c.createdAt,
      }));

      res.json({ sources });
    } catch (error) {
      res.json({ sources: [] });
    }
  });

  // Fetch contacts from source
  app.get('/api/contacts/:sourceId', async (req: Request, res: Response) => {
    const { sourceId } = req.params;
    const { userId = 'default-user' } = req.query;

    try {
      const contacts = await fetchContacts(
        userId as string,
        sourceId as SocialSource
      );
      res.json({ contacts });
    } catch (error) {
      console.error('Contact fetch failed:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  });
}
