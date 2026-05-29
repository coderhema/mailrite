/**
 * MailRite Outreach Agent — Flue Harness
 * 
 * Autonomous agent for contact search, filtering, and draft generation.
 * Runs on Flue's programmable agent harness architecture.
 */

import type { FlueContext } from '@flue/sdk/client';
import * as v from 'valibot';

// ─── Triggers ─────────────────────────────────────────────────────────────────
export const triggers = {
  webhook: true,  // Accepts { action, prompt, contactSource, userId, sql }
};

// ─── Output Schema ────────────────────────────────────────────────────────────
const SearchResult = v.object({
  contactIds: v.array(v.string()),
  source: v.literal('local'),
  confidence: v.number(),
});

const DraftResult = v.object({
  draft: v.string(),
  subject: v.string(),
  source: v.literal('local'),
});

// ─── Agent Entrypoint ─────────────────────────────────────────────────────────
export default async function ({ init, payload, env }: FlueContext) {
  const { action, prompt, contact, userId, sql } = payload;

  const session = await init({
    model: 'anthropic/claude-sonnet-4-6',
    sandbox: 'empty',
  });

  // ─── Route by Action ─────────────────────────────────────────────────────
  switch (action) {
    case 'coral-query': {
      if (!sql) {
        return { error: 'Missing required field: sql' };
      }

      return await session.skill('coral-query', {
        args: { sql },
        result: v.object({
          columns: v.array(v.string()),
          rows: v.array(v.any()),
          rowCount: v.number(),
        }),
      });
    }

    case 'search': {
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
      const searchResult = await session.skill('contact-search', {
        args: { prompt, userId },
        result: SearchResult,
      });

      if (searchResult.contactIds.length === 0) {
        return { contacts: [], drafts: [] };
      }

      // Fetch contact details via Coral SQL
      const ids = searchResult.contactIds.map(id => `'${id}'`).join(',');
      const result = await session.skill('coral-query', {
        args: { sql: `SELECT * FROM linkedin.connections WHERE id IN (${ids})` },
        result: v.object({
          columns: v.array(v.string()),
          rows: v.array(v.any()),
          rowCount: v.number(),
        }),
      });

      const contacts = result.rows.slice(0, 5);
      const drafts = await Promise.all(
        contacts.map(async (c: any) => {
          const draft = await session.skill('outreach-draft', {
            args: { prompt, contact: c },
            result: DraftResult,
          });
          return { contact: c, draft };
        })
      );

      return { contacts, drafts };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
