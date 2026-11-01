import { mkdir, writeFile } from "fs/promises";
import { resolve } from "path";

const OUTBOX = resolve(__dirname, "../mail-outbox");

/**
 * Production: Resend (RESEND_API_KEY + MAIL_FROM on a domain verified in Resend).
 * Local (no key): the email is written to backend/mail-outbox/*.html so you can open it in a browser.
 */
export async function sendMail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    await mkdir(OUTBOX, { recursive: true });
    const file = resolve(OUTBOX, `${new Date().toISOString().replace(/[:.]/g, "-")}-${to.replace(/[^\w.@-]/g, "_")}.html`);
    await writeFile(file, `<!-- To: ${to} | Subject: ${subject} -->\n${html}`);
    console.log(`[mail] (local) ${to} — ${subject} → ${file}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM ?? "Nguyễn Hồng Tuấn <onboarding@resend.dev>", to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

/** Escape user/admin text before putting it in email HTML. */
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
