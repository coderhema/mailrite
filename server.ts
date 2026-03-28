import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Routes
  app.get("/api/auth/url", (req, res) => {
    const { sourceId } = req.query;
    const envVarName = `${String(sourceId).toUpperCase()}_CLIENT_ID`;
    const clientId = process.env[envVarName];
    
    // Construct Redirect URI
    // In AI Studio, we should use the APP_URL if available, otherwise fallback to host
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${appUrl}/auth/callback`;

    if (!clientId) {
      // DEMO MODE: If no client ID is provided, return a mock URL
      console.log(`[OAuth] No Client ID found for ${sourceId}. Using Demo Mode.`);
      return res.json({ 
        url: `${appUrl}/auth/demo?sourceId=${sourceId}&name=${sourceId}` 
      });
    }

    // REAL OAUTH: Construct real provider URL (Example for Google/Gmail)
    // In a real app, you'd have a mapping of sourceId -> providerAuthUrl
    let providerUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    let scope = "https://www.googleapis.com/auth/userinfo.email";

    if (sourceId === 'linkedin') {
      providerUrl = "https://www.linkedin.com/oauth/v2/authorization";
      scope = "r_liteprofile r_emailaddress";
    } else if (sourceId === 'slack') {
      providerUrl = "https://slack.com/oauth/v2/authorize";
      scope = "users:read";
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scope,
      state: String(sourceId),
    });

    res.json({ url: `${providerUrl}?${params.toString()}` });
  });

  // OAuth Callback Handler
  app.get("/auth/callback", (req, res) => {
    const { code, state } = req.query;
    
    // Here you would normally exchange the code for tokens
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

  // Demo Mode Handler (Simulates a successful OAuth flow without real keys)
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

  // Email Sending Endpoint
  app.post("/api/send-email", express.json(), async (req, res) => {
    const { to, subject, body, source } = req.body;

    if (!to || !body) {
      return res.status(400).json({ error: "Missing recipient or body" });
    }

    console.log(`[Email] Attempting to send email via ${source} to ${to}`);

    // Check for SMTP credentials
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn("[Email] SMTP credentials missing. Falling back to mock success for demo.");
      // In a real app, you might want to return an error here if not in demo mode
      // But for this environment, we'll simulate success if keys are missing
      return res.json({ 
        success: true, 
        message: "Email sent (Demo Mode - no SMTP keys configured)",
        preview: { to, subject, body, source }
      });
    }

    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || "587"),
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
      res.json({ success: true, messageId: info.messageId });
    } catch (error) {
      console.error("[Email] Error sending email:", error);
      res.status(500).json({ error: "Failed to send email", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Vite middleware for development
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
