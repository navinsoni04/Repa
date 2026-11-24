import { getDatabase } from "@netlify/database";
import { requireAdmin } from "../lib/auth.mjs";
import { fail, json, readJson } from "../lib/http.mjs";

const db = getDatabase();
const MAX_JSON = 6_000_000;
const str = (v, max) => typeof v === "string" && v.length <= max;
const offerText = (value, max) => str(value, max) && value.trim().length > 0;
const validOffers = (offers) =>
  offers === undefined ||
  (Array.isArray(offers) &&
    offers.length <= 20 &&
    offers.every((offer) => offer && offerText(offer.title, 100) && offerText(offer.details, 400)));

// Only accept the shape the website actually uses.
const validCatalog = (d) =>
  d &&
  typeof d === "object" &&
  d.shop &&
  typeof d.shop === "object" &&
  !Array.isArray(d.shop) &&
  validOffers(d.shop.offers) &&
  Array.isArray(d.items) &&
  d.items.length <= 2000 &&
  d.items.every(
    (i) => i && typeof i === "object" && str(i.id, 80) && str(i.name, 200) && str(i.img, 5_000_000),
  );

const approvedReviews = () => db.sql`
  SELECT id, name, text, stars, created_at AS "createdAt"
  FROM reviews WHERE approved = true
  ORDER BY created_at DESC LIMIT 100`;

export default async (req) => {
  if (req.method === "GET") {
    const [row] = await db.sql`SELECT data, revision FROM catalog WHERE id = 1`;
    return json({
      data: row?.data ?? null,
      revision: row?.revision ?? 0,
      reviews: await approvedReviews(),
    });
  }

  if (req.method === "PUT") {
    const denied = await requireAdmin(req, { write: true });
    if (denied) return denied;
    const { value, error } = await readJson(req, MAX_JSON);
    if (error) return error;
    const { data, revision } = value ?? {};
    if (!Number.isInteger(revision) || revision < 0) return fail(400, "Invalid request.");
    if (!validCatalog(data)) return fail(400, "Catalog data is not valid.");
    const payload = JSON.stringify(data);

    let saved;
    if (revision === 0) {
      [saved] = await db.sql`
        INSERT INTO catalog (id, data, revision) VALUES (1, ${payload}::jsonb, 1)
        ON CONFLICT (id) DO NOTHING RETURNING revision`;
    } else {
      [saved] = await db.sql`
        UPDATE catalog SET data = ${payload}::jsonb, revision = revision + 1
        WHERE id = 1 AND revision = ${revision} RETURNING revision`;
    }
    if (!saved) return fail(409, "The shop data changed in another tab. Refresh the page and try again.");
    return json({ revision: saved.revision });
  }

  return fail(405, "Method not allowed.");
};

export const config = { path: "/api/catalog" };
