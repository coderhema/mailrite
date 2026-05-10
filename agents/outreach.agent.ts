/**
 * MailRite Outreach Agent — Flue Harness
 * 
 * Autonomous agent for contact search, filtering, and draft generation.
 * Runs on Flue's programmable agent harness architecture.
 * 
 * @flue/sdk — Model + Harness + Sandbox + Filesystem
 * @composio/sdk — Social auth and contact extraction
 */

import type { FlueContext } from '@flue/sdk/client';
import { Composio } from '@composio/sdk';
import * as v from 'valibot';

// ─── Triggers ─────────────────────────────────────────────────────────────────
export const triggers = {
  webhook: true,  // Accepts { action, prompt, contactSource, userId }
};

// ─── Output Schema ────────────────────────────────────────────────────────────
const SearchResult = v.object({
  contactIds: v.array(v.string()),
  source: v.picklist(['composio', 'local']),
  confidence: v.number(),
});

const DraftResult = v.object({
  draft: v.string(),
  subject: v.string(),
  source: v.picklist(['composio', 'local']),
});

// ─── Agent Entrypoint ─────────────────────────────────────────────────────────
export default async function ({ init, payload, env }: FlueContext) {
  const { action, prompt, contact, userId } = payload;

  // Initialize agent with structured skills
  const agent = await init({
    model: 'anthropic/claude-sonnet-4-6',
    sandbox: 'default',  // Built-in zero-config sandbox
  });

  const session = await agent.session();

  // ─── Composio Client (server-side, tokens never exposed to agent) ────────
  const composio = new Composio({ apiKey: env.COMPOSIO_API_KEY });

  // ─── Route by Action ─────────────────────────────────────────────────────
  switch (action) {
    case 'search': {
      // Skill: contact-search
      // Uses Composio to pull real contacts from connected social accounts
      return await session.skill('contact-search', {
        args: { prompt, userId },
        result: SearchResult,
      });
    }

    case 'draft': {
      // Skill: outreach-draft
      // Generates personalized draft using contact context
      return await session.skill('outreach-draft', {
        args: { prompt, contact },
        result: DraftResult,
      });
    }

    case 'full-pipeline': {
      // Skill: full-outreach-pipeline
      // 1. Search contacts via Composio integrations
      // 2. Rank by relevance
      // 3. Generate drafts for top matches
      const searchResult = await session.skill('contact-search', {
        args: { prompt, userId },
        result: SearchResult,
      });

      if (searchResult.contactIds.length === 0) {
        return { contacts: [], drafts: [] };
      }

      // Fetch contact details via Composio
      const contacts = await composio.tools.execute(
        'LINKEDIN_GET_PROFILE_BATCH',
        { userId, contactIds: searchResult.contactIds }
      );

      // Generate drafts for top 5 contacts
      const topContacts = contacts.slice(0, 5);
      const drafts = await Promise.all(
        topContacts.map(async (c: any) => {
          const draft = await session.skill('outreach-draft', {
            args: { prompt, contact: c },
            result: DraftResult,
          });
          return { contact: c, draft };
        })
      );

      return { contacts: topContacts, drafts };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
