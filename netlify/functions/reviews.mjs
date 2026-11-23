import { getDatabase } from "@netlify/database";
import { requireAdmin } from "../lib/auth.mjs";
import { fail, json, readJson } from "../lib/http.mjs";

const db = getDatabase();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PENDING = 200;

export default async (req) => {
  const id = new URL(req.url).pathname.split("/")[3]; // /api/reviews/:id

  if (!id) {
    if (req.method === "GET") {
      const denied = await requireAdmin(req);
      if (denied) return denied;
      return json(
        await db.sql`SELECT id, name, text, stars, created_at AS "createdAt"
                     FROM reviews WHERE approved = false ORDER BY created_at ASC LIMIT 200`,
      );
    }
    if (req.method === "POST") {
      const { value, error } = await readJson(req, 5_000);
      if (error) return error;
      const name = typeof value?.name === "string" ? value.name.trim() : "";
      const text = typeof value?.text === "string" ? value.text.trim() : "";
      const stars = value?.stars;
      if (!name || name.length > 40 || !text || text.length > 400 || !Number.isInteger(stars) || stars < 1 || stars > 5)
        return fail(400, "Please fill name, stars and review correctly.");
      const [{ count }] = await db.sql`SELECT count(*)::int AS count FROM reviews WHERE approved = false`;
      if (count >= MAX_PENDING) return fail(429, "Too many reviews waiting. Please try again later.");
      await db.sql`INSERT INTO reviews (name, text, stars) VALUES (${name}, ${text}, ${stars})`;
      return json({ ok: true }, 201);
    }
    return fail(405, "Method not allowed.");
  }

  if (!UUID.test(id)) return fail(404, "Not found.");
  if (req.method !== "PATCH" && req.method !== "DELETE") return fail(405, "Method not allowed.");
  const denied = await requireAdmin(req, { write: true });
  if (denied) return denied;
  const rows =
    req.method === "PATCH"
      ? await db.sql`UPDATE reviews SET approved = true WHERE id = ${id} RETURNING id`
      : await db.sql`DELETE FROM reviews WHERE id = ${id} RETURNING id`;
  if (!rows.length) return fail(404, "Review not found.");
  return json({ ok: true });
};

export const config = { path: ["/api/reviews", "/api/reviews/:id"] };
