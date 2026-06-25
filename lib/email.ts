import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.RESEND_FROM_EMAIL ?? "Study Streak <noreply@studystreak.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/* ── Password Reset Email ─────────────────────────────────── */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  if (!resend) {
    // Development fallback — log to console when no API key is set
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[EMAIL] Password reset for:", to);
    console.log("[EMAIL] Reset URL:", resetUrl);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return { success: true };
  }

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Reset your Study Streak password",
      html: buildResetEmail(name, resetUrl),
    });
    return { success: true };
  } catch (err) {
    console.error("[Email] Failed to send reset email:", err);
    return { success: false, error: "Failed to send email" };
  }
}

/* ── HTML email template ──────────────────────────────────── */
function buildResetEmail(name: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width"/>
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background:#F8F5F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F5F0;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1A1A1A,#2A2A2A);padding:32px 40px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#E63946,#C1121F);display:inline-flex;align-items:center;justify-content:center;">
              <span style="color:#fff;font-size:18px;">💎</span>
            </div>
            <span style="color:#fff;font-size:18px;font-weight:800;">Study Streak</span>
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1A1A1A;">Reset your password</h1>
          <p style="margin:0 0 24px;color:#6B6B6B;font-size:15px;line-height:1.6;">
            Hi ${name}, we received a request to reset your Study Streak password.
            Click the button below to create a new password.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}"
               style="display:inline-block;background:linear-gradient(135deg,#E63946,#C1121F);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:16px;">
              Reset Password
            </a>
          </div>

          <p style="margin:0 0 8px;color:#9B9B9B;font-size:13px;line-height:1.6;">
            This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
          </p>
          <p style="margin:0;color:#9B9B9B;font-size:13px;">Or copy this link: <a href="${resetUrl}" style="color:#E63946;">${resetUrl}</a></p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F8F5F0;padding:20px 40px;text-align:center;">
          <p style="margin:0;color:#9B9B9B;font-size:12px;">© 2026 Study Streak · All rights reserved</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
