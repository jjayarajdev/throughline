import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

/**
 * Email service.
 *
 * Three providers are supported via `EMAIL_PROVIDER`:
 *
 *   - `console` : log the generated link to stdout. Zero dependencies,
 *                 useful for CI and for "I just want to grep the link"
 *                 debugging. This is the Phase 1 default.
 *
 *   - `smtp`    : send via nodemailer to a local SMTP catcher. The dev
 *                 default points at the shared MailHog container
 *                 (localhost:1025 / :8025) also used by zephyrflow. This
 *                 gives us a real rendered email in a browseable inbox
 *                 without touching AWS or installing anything new.
 *
 *   - `ses`     : stubbed. Wired once gigcruite.com DNS is live (SPF/DKIM/
 *                 DMARC + SES production access + verified sender).
 *
 * Link targets resolve against the first origin in CORS_ORIGIN (the web
 * app's dev origin by default).
 */

const WEB_BASE =
  env.CORS_ORIGIN.split(',')[0]?.trim() ?? 'http://localhost:4001';

// --- SMTP transporter (lazy singleton) --------------------------------------
//
// We construct the nodemailer transport the first time an SMTP send is
// requested and then reuse it. In `console` mode nothing is ever
// constructed, so tests and CI pay zero cost for this module.

let smtpTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter {
  if (smtpTransporter) return smtpTransporter;
  smtpTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    // Dev SMTP catchers (MailHog, Mailpit) often advertise STARTTLS but
    // fail the handshake. `ignoreTLS` skips the upgrade entirely — safe
    // for local dev, and prod uses SES (not SMTP) anyway.
    ignoreTLS: !env.SMTP_SECURE,
    // Auth is only attached when BOTH user and pass are set. MailHog
    // doesn't require credentials in its default config, so leaving
    // SMTP_USER / SMTP_PASS undefined lets the connection proceed
    // unauthenticated. Any future relay with auth just needs those
    // two env vars set — no code change.
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });
  return smtpTransporter;
}

// --- Console helper ---------------------------------------------------------

function logConsole(label: string, to: string, url: string): void {
  const bar = '─'.repeat(60);
  console.log(
    `\n${bar}\n📧 [email:${label}]\n   to   : ${to}\n   from : ${env.EMAIL_FROM}\n   link : ${url}\n${bar}\n`,
  );
}

// --- HTML templates ---------------------------------------------------------
//
// These are intentionally plain table-based layouts with inline styles
// rather than modern flex/grid CSS: most email clients (Outlook desktop
// being the biggest offender) still parse a late-90s HTML subset and
// strip `<style>` tags. Inline styles + presentational tables are the
// lowest common denominator that renders consistently from Gmail to
// Outlook to the MailHog preview pane.
//
// When we wire SES we'll likely lift these into a dedicated templates
// module with an unsubscribe footer, multi-language variants, and
// probably a tiny merge-tag helper. For now a single-file template is
// plenty — we send exactly two emails in Phase 1 (verify + reset).

interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

function verifyEmailTemplate(url: string): EmailTemplate {
  return {
    subject: 'Verify your GigCruite email',
    text:
      `Welcome to GigCruite!\n\n` +
      `Please verify your email address by clicking the link below:\n\n` +
      `${url}\n\n` +
      `If you did not create this account, you can safely ignore this message.\n`,
    html: baseLayout(
      'Verify your email',
      `
        <p style="margin:0 0 16px;">Welcome to GigCruite!</p>
        <p style="margin:0 0 24px;">Click the button below to verify your email address and activate your account.</p>
        ${buttonRow('Verify email', url)}
        <p style="margin:24px 0 0;font-size:12px;color:#6b7280;">If the button doesn't work, paste this link into your browser:<br/><a href="${url}" style="color:#4f46e5;word-break:break-all;">${url}</a></p>
      `,
    ),
  };
}

function resetPasswordTemplate(url: string): EmailTemplate {
  return {
    subject: 'Reset your GigCruite password',
    text:
      `We received a request to reset your GigCruite password.\n\n` +
      `Click the link below to set a new password (valid for 1 hour):\n\n` +
      `${url}\n\n` +
      `If you didn't request a password reset, you can safely ignore this message.\n`,
    html: baseLayout(
      'Reset your password',
      `
        <p style="margin:0 0 16px;">We received a request to reset your GigCruite password.</p>
        <p style="margin:0 0 24px;">Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.</p>
        ${buttonRow('Reset password', url)}
        <p style="margin:24px 0 0;font-size:12px;color:#6b7280;">If the button doesn't work, paste this link into your browser:<br/><a href="${url}" style="color:#4f46e5;word-break:break-all;">${url}</a></p>
        <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">If you didn't request this, you can safely ignore this message.</p>
      `,
    ),
  };
}

function baseLayout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f6fa;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border-radius:8px;box-shadow:0 1px 2px rgba(0,0,0,0.06);overflow:hidden;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #eef0f5;">
                <span style="font-size:18px;font-weight:700;color:#4f46e5;">GigCruite</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${title}</h1>
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #eef0f5;font-size:12px;color:#9ca3af;">
                GigCruite — Trust-first gig recruiting
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buttonRow(label: string, href: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="background:#4f46e5;border-radius:6px;">
          <a href="${href}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-weight:600;text-decoration:none;font-size:14px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// --- SMTP dispatch ----------------------------------------------------------

async function sendViaSmtp(to: string, template: EmailTemplate): Promise<void> {
  const transporter = getSmtpTransporter();
  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: template.subject,
    text: template.text,
    html: template.html,
  });
}

// --- Public API -------------------------------------------------------------

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const url = `${WEB_BASE}/verify-email?token=${encodeURIComponent(token)}`;
  if (env.EMAIL_PROVIDER === 'console') {
    logConsole('verify', to, url);
    return;
  }
  if (env.EMAIL_PROVIDER === 'smtp') {
    await sendViaSmtp(to, verifyEmailTemplate(url));
    return;
  }
  throw new Error('SES email provider not implemented until Wave 7');
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  const url = `${WEB_BASE}/reset-password?token=${encodeURIComponent(token)}`;
  if (env.EMAIL_PROVIDER === 'console') {
    logConsole('reset-password', to, url);
    return;
  }
  if (env.EMAIL_PROVIDER === 'smtp') {
    await sendViaSmtp(to, resetPasswordTemplate(url));
    return;
  }
  throw new Error('SES email provider not implemented until Wave 7');
}
