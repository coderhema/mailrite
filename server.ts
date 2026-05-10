import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";
import type { Contact } from "./src/types.ts";
import { authRouter, requireAuth } from "./src/auth.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type PokeResponse = Record<string, unknown>;

type X402Quote = {
  required: boolean;
  chainId: number;
  amountWei: string;
  routerAddress: string;
  sendId: string;
  memo: string;
  recipient: string;
};

function normalizeContacts(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (entry && typeof entry === "object" && "id" in entry && typeof (entry as { id?: unknown }).id === "string") {
          return (entry as { id: string }).id;
        }

        return "";
      })
      .filter(Boolean);
  }

  return [];
}

function localContactSearch(prompt: string, contacts: Contact[]) {
  const terms = prompt.toLowerCase().split(/\s+/).filter(Boolean);

  return contacts
    .map((contact) => {
      const haystack = [contact.name, contact.role, contact.company, contact.email || "", contact.source].join(" ").toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { contact, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.contact.id);
}

function localDraft(prompt: string, contact: Contact) {
  const firstName = contact.name.split(" ")[0] || contact.name;
  return [
    `Hey ${firstName},`,
    "",
    `I was thinking about your work at ${contact.company} and wanted to reach out about ${prompt}.`,
    "",
    "If it makes sense, I would love to connect and share a quick note.",
    "",
    "Thanks,",
    "Tolulope",
  ].join("\n");
}

async function callPokeIntelligence(task: string, payload: Record<string, unknown>): Promise<PokeResponse | null> {
  const baseUrl = process.env.POKE_API_BASE_URL;
  const apiKey = process.env.POKE_API_KEY;
  const apiPath = process.env.POKE_API_PATH;

  if (!baseUrl || !apiKey || !apiPath) {
    return null;
  }

  const response = await fetch(new URL(apiPath, baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ task, payload }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Poke API request failed with ${response.status}: ${text}`);
  }

  return (await response.json()) as PokeResponse;
}

function buildX402Quote(input: { to: string; subject?: string; body: string; source?: string }): X402Quote {
  const amountWei = process.env.X402_SEND_FEE_WEI || "0";
  const routerAddress = process.env.BASE_PAYMENT_ROUTER_ADDRESS || "";
  const chainId = Number(process.env.BASE_CHAIN_ID || "8453");
  const memo = crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");

  return {
    required: amountWei !== "0" && routerAddress.length > 0,
    chainId,
    amountWei,
    routerAddress,
    sendId: memo,
    memo,
    recipient: input.to,
  };
}

function parseReceipt(headerValue: string | undefined) {
  if (!headerValue) {
    return null;
  }

  try {
    return JSON.parse(headerValue);
  } catch {
    return null;
  }
}

function verifyReceipt(receipt: unknown, quote: X402Quote) {
  if (!receipt || typeof receipt !== "object") {
    return false;
  }

  const typed = receipt as Record<string, unknown>;
  return typed.chainId === quote.chainId && typed.amountWei === quote.amountWei && typed.routerAddress === quote.routerAddress;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ─── User Auth Routes (signup, login, logout, me) ──────────────────────
  app.use("/api/auth", authRouter);

  // ─── Social Source OAuth Routes (LinkedIn, Gmail, etc.) ────────────────
  app.get("/api/social/auth/url", (req, res) => {
    const sourceId = req.query.sourceId as string;
    const envVarName = `${String(sourceId).toUpperCase()}_CLIENT_ID`;
    const clientId = process.env[envVarName];
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${appUrl}/auth/callback`;

    if (!clientId) {
      console.log(`[OAuth] No Client ID found for ${sourceId}. Using Demo Mode.`);
      return res.json({
        url: `${appUrl}/auth/demo?sourceId=${sourceId}&name=${sourceId}`,
      });
    }

    let providerUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    let scope = "https://www.googleapis.com/auth/userinfo.email";

    if (sourceId === "linkedin") {
      providerUrl = "https://www.linkedin.com/oauth/v2/authorization";
      scope = "r_liteprofile r_emailaddress";
    } else if (sourceId === "slack") {
      providerUrl = "https://slack.com/oauth/v2/authorize";
      scope = "users:read";
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope,
      state: String(sourceId),
    });

    res.json({ url: `${providerUrl}?${params.toString()}` });
  });

  app.get("/auth/callback", (req, res) => {
    const { code, state } = req.query;

    console.log(`[OAuth] Received callback for ${state} with code: ${code}`);

    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0a0a; color: white;">
          <div style="text-align: center; padding: 2rem; background: #1a1a1a; border-radius: 1rem; border: 1px solid #333;">
            <h2 style="color: #10b981;">Connection Successful!</h2>
            <p>Your <b>${state}</b> account has been linked to MailRite.</p>
            <p style="font-size: 0.8rem; color: #888;">This window will close automatically.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'OAUTH_AUTH_SUCCESS',
                  sourceId: '${state}'
                }, '*');
                setTimeout(() => window.close(), 1500);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  });

  app.get("/auth/demo", (req, res) => {
    const { sourceId } = req.query;
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0a0a; color: white;">
          <div style="text-align: center; padding: 2rem; background: #1a1a1a; border-radius: 1rem; border: 1px solid #333; max-width: 400px;">
            <div style="background: #f59e0b; color: black; display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.7rem; font-weight: bold; margin-bottom: 1rem;">DEMO MODE</div>
            <h2 style="color: #10b981;">Simulated Connection</h2>
            <p>You haven't configured a Client ID for <b>${sourceId}</b> yet, so we're simulating a successful connection.</p>
            <button onclick="finish()" style="background: #10b981; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: bold; margin-top: 1rem;">Complete Connection</button>
            <script>
              function finish() {
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'OAUTH_AUTH_SUCCESS',
                    sourceId: '${sourceId}'
                  }, '*');
                  window.close();
                }
              }
            </script>
          </div>
        </body>
      </html>
    `);
  });

  app.post("/api/poke/contacts/search", express.json(), async (req, res) => {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
    const contacts = Array.isArray(req.body?.contacts) ? (req.body.contacts as Contact[]) : [];

    try {
      const response = await callPokeIntelligence("search_contacts", { prompt, contacts });
      const contactIds = normalizeContacts(response?.contactIds ?? response?.results ?? response?.contacts);

      if (contactIds.length > 0) {
        return res.json({ contactIds, source: "poke" });
      }
    } catch (error) {
      console.error("[Poke] contact search failed, using local fallback", error);
    }

    return res.json({ contactIds: localContactSearch(prompt, contacts), source: "local" });
  });

  app.post("/api/poke/outreach/draft", express.json(), async (req, res) => {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";
    const contact = req.body?.contact as Contact | undefined;

    if (!contact) {
      return res.status(400).json({ error: "Missing contact" });
    }

    try {
      const response = await callPokeIntelligence("generate_draft", { prompt, contact });
      const draft =
        (typeof response?.draft === "string" && response.draft) ||
        (typeof response?.text === "string" && response.text) ||
        (typeof response?.content === "string" && response.content) ||
        (typeof response?.message === "string" && response.message) ||
        "";

      if (draft) {
        return res.json({ draft, source: "poke" });
      }
    } catch (error) {
      console.error("[Poke] draft generation failed, using local fallback", error);
    }

    return res.json({ draft: localDraft(prompt, contact), source: "local" });
  });

  app.post("/api/payments/x402/quote", express.json(), (req, res) => {
    const quote = buildX402Quote({
      to: typeof req.body?.to === "string" ? req.body.to : "",
      subject: typeof req.body?.subject === "string" ? req.body.subject : "",
      body: typeof req.body?.body === "string" ? req.body.body : "",
      source: typeof req.body?.source === "string" ? req.body.source : "",
    });

    return res.json({ quote });
  });

  app.post("/api/send-email", express.json(), async (req, res) => {
    const { to, subject, body, source } = req.body;

    if (!to || !body) {
      return res.status(400).json({ error: "Missing recipient or body" });
    }

    const quote = buildX402Quote({
      to,
      subject,
      body,
      source,
    });

    const strictPayment = process.env.X402_STRICT === "true";
    const receipt = parseReceipt(req.headers["x-payment-authorization"] as string | undefined);

    if (quote.required && strictPayment && !verifyReceipt(receipt, quote)) {
      return res.status(402).json({
        error: "Payment required",
        payment: quote,
        header: "x-payment-authorization",
      });
    }

    console.log(`[Email] Attempting to send email via ${source} to ${to}`);

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn("[Email] SMTP credentials missing. Falling back to mock success for demo.");
      return res.json({
        success: true,
        message: "Email sent, demo mode used because SMTP keys are not configured",
        payment: quote,
        preview: { to, subject, body, source },
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || "587", 10),
        secure: SMTP_PORT === "465",
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: SMTP_FROM || SMTP_USER,
        to,
        subject: subject || "Message from MailRite",
        text: body,
      });

      console.log("[Email] Message sent: %s", info.messageId);
      res.json({
        success: true,
        messageId: info.messageId,
        payment: quote,
      });
    } catch (error) {
      console.error("[Email] Error sending email:", error);
      res.status(500).json({
        error: "Failed to send email",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
