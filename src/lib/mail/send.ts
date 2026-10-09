export type MailResult = { sent: boolean; logged: boolean };

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
