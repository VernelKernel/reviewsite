export type MailResult = { sent: boolean; logged: boolean };

export function accountVerificationEmailHtml(url: string): string {
  const safe = url.replace(/"/g, "%22");
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Confirm your Frame account</title>
  </head>
  <body style="margin:0;padding:32px 16px;background:#f4f1ea;color:#1c1915;font-family:Georgia,serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fffdf8;border:1px solid #d9d2c5;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-family:sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b645b;">Frame</p>
                <h1 style="margin:0 0 16px;font-size:28px;font-weight:500;line-height:1.2;">Confirm your email</h1>
                <p style="margin:0 0 24px;font-family:sans-serif;font-size:16px;line-height:1.5;">Open this link to finish creating the account. It expires in 24 hours.</p>
                <p style="margin:0 0 24px;"><a href="${safe}" style="font-family:sans-serif;font-size:16px;color:#1c1915;">Confirm email</a></p>
                <p style="margin:0;font-family:sans-serif;font-size:14px;line-height:1.5;color:#6b645b;">If you did not create an account, you can ignore this message.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function accountVerificationUrl(token: string): string {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${origin}/verify?token=${encodeURIComponent(token)}`;
}

export async function sendAccountVerificationEmail(input: { to: string; url: string }): Promise<MailResult> {
  const dev = process.env.NODE_ENV !== "production";
  if (dev) console.info(`Account verification link for ${input.to}: ${input.url}`);
  const webhook = process.env.MAIL_WEBHOOK_URL?.trim();
  if (!webhook) return { sent: false, logged: dev };
  const html = accountVerificationEmailHtml(input.url);
  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: input.to,
        subject: "Confirm your Frame account",
        html,
        text: `Confirm your Frame account: ${input.url}. This link expires in 24 hours.`,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.error(`Account verification mail for ${input.to} failed with ${response.status}.`);
      return { sent: false, logged: dev };
    }
    return { sent: true, logged: dev };
  } catch (error) {
    console.error(`Account verification mail failed: ${error instanceof Error ? error.message : "send failed"}`);
    return { sent: false, logged: dev };
  }
}

