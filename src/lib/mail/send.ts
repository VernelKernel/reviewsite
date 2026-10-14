export type MailResult = { sent: boolean; logged: boolean };

export function loginCodeEmailHtml(code: string): string {
  const safe = code.replace(/[^\d]/g, "").slice(0, 6);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Your Frame sign-in code</title>
  </head>
  <body style="margin:0;padding:32px 16px;background:#f4f1ea;color:#1c1915;font-family:Georgia,serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fffdf8;border:1px solid #d9d2c5;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-family:sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b645b;">Frame</p>
                <h1 style="margin:0 0 16px;font-size:28px;font-weight:500;line-height:1.2;">Your sign-in code</h1>
                <p style="margin:0 0 24px;font-family:sans-serif;font-size:16px;line-height:1.5;">Enter this code to finish signing in. It expires in 10 minutes.</p>
                <p style="margin:0 0 24px;font-family:sans-serif;font-size:32px;letter-spacing:0.28em;font-weight:650;">${safe}</p>
                <p style="margin:0;font-family:sans-serif;font-size:14px;line-height:1.5;color:#6b645b;">If you did not ask for this code, you can ignore this message.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendLoginCodeEmail(input: { to: string; code: string }): Promise<MailResult> {
  const dev = process.env.NODE_ENV !== "production";
  if (dev) {
    console.info(`[email / console] ${input.to} — code: ${input.code}`);
  }
  const webhook = process.env.MAIL_WEBHOOK_URL?.trim();
  if (!webhook) return { sent: false, logged: dev };
  const html = loginCodeEmailHtml(input.code);
  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: input.to,
        subject: "Your Frame sign-in code",
        html,
        text: `Your Frame sign-in code is ${input.code}. It expires in 10 minutes.`,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.error(`Sign-in code mail for ${input.to} failed with ${response.status}.`);
      return { sent: false, logged: dev };
    }
    return { sent: true, logged: dev };
  } catch (error) {
    console.error(`Sign-in code mail failed: ${error instanceof Error ? error.message : "send failed"}`);
    return { sent: false, logged: dev };
  }
}

export async function sendVerificationEmail(input: { to: string; url: string }): Promise<MailResult> {
  const webhook = process.env.MAIL_WEBHOOK_URL?.trim();
  if (!webhook) {
    console.info(`Verification link for ${input.to}: ${input.url}`);
    return { sent: false, logged: true };
  }
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: input.to, url: input.url, subject: "Verify your Frame review" }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    console.error(`Verification mail for ${input.to} failed with ${response.status}. Link: ${input.url}`);
    return { sent: false, logged: true };
  }
  return { sent: true, logged: false };
}

export function verificationUrl(token: string): string {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${origin}/review/verify?token=${encodeURIComponent(token)}`;
}
