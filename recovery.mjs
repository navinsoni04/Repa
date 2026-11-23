import { ADMIN_EMAIL, normalizeEmail } from "../lib/config.mjs";
import { fail, json, readJson, sameOrigin } from "../lib/http.mjs";

// POST /api/admin/recovery {email}
// Always answers the same way, and only ever sends a reset mail to the
// designated admin address, so it cannot be used to spam other people.
export default async (req) => {
  if (req.method !== "POST") return fail(405, "Method not allowed.");
  if (!sameOrigin(req)) return fail(403, "Cross-site request blocked.");
  const { value, error } = await readJson(req, 2_000);
  if (error) return error;
  if (normalizeEmail(value?.email) === normalizeEmail(ADMIN_EMAIL)) {
    try {
      await fetch(new URL("/.netlify/identity/recover", req.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ADMIN_EMAIL }),
      });
    } catch {
      // Swallow: the response must not reveal anything.
    }
  }
  return json({ ok: true });
};

export const config = { path: "/api/admin/recovery" };
