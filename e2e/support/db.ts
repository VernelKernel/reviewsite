import { createHash } from "node:crypto";
import { config } from "dotenv";
import pg from "pg";

config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function latestLoginCode(email: string): Promise<string> {
  const result = await pool.query<{ codeHash: string }>(
    `SELECT c."codeHash"
     FROM "EmailLoginCode" c
     JOIN "User" u ON u.id = c."userId"
     WHERE u.email = $1 AND c."usedAt" IS NULL
     ORDER BY c."createdAt" DESC
     LIMIT 1`,
    [email.toLowerCase()],
  );
  const challenge = result.rows[0];
  if (!challenge) throw new Error(`No sign-in code is waiting for ${email}.`);
  for (let value = 0; value < 1_000_000; value += 1) {
    const code = value.toString().padStart(6, "0");
    if (hashToken(code) === challenge.codeHash) return code;
  }
  throw new Error(`The sign-in code for ${email} could not be read.`);
}

export async function publishedGame(): Promise<{ slug: string; title: string }> {
  const preferred = await pool.query<{ slug: string; title: string }>(
    `SELECT slug, title FROM "Work" WHERE status = 'PUBLISHED' AND "workType" = 'GAME' AND slug = $1`,
    ["ace-combat-8-wings-of-theve"],
  );
  if (preferred.rows[0]) return preferred.rows[0];
  const fallback = await pool.query<{ slug: string; title: string }>(
    `SELECT slug, title FROM "Work" WHERE status = 'PUBLISHED' AND "workType" = 'GAME' ORDER BY title LIMIT 1`,
  );
  const game = fallback.rows[0];
  if (!game) throw new Error("No published game is available for the visitor tests.");
  return game;
}

export async function removeVisitor(email: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const user = await client.query<{ id: string }>(`SELECT id FROM "User" WHERE email = $1`, [email.toLowerCase()]);
    const userId = user.rows[0]?.id;
    if (!userId) {
      await client.query("COMMIT");
      return;
    }
    await client.query(
      `DELETE FROM "Evaluation" WHERE "reviewerId" IN (SELECT id FROM "ReviewerProfile" WHERE "userId" = $1)`,
      [userId],
    );
    await client.query(`DELETE FROM "Intake" WHERE "userId" = $1`, [userId]);
    await client.query(`DELETE FROM "VerificationToken" WHERE "userId" = $1`, [userId]);
    await client.query(`DELETE FROM "EmailLoginCode" WHERE "userId" = $1`, [userId]);
    await client.query(`DELETE FROM "Session" WHERE "userId" = $1`, [userId]);
    await client.query(`DELETE FROM "AuthenticationIdentity" WHERE "userId" = $1`, [userId]);
    await client.query(`DELETE FROM "UserPreference" WHERE "userId" = $1`, [userId]);
    await client.query(`DELETE FROM "ReviewerProfile" WHERE "userId" = $1`, [userId]);
    await client.query(`DELETE FROM "User" WHERE id = $1`, [userId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
