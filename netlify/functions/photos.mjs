import { getStore } from "@netlify/blobs";
import { requireAdmin } from "../lib/auth.mjs";
import { fail, json } from "../lib/http.mjs";

const MAX_BYTES = 3_000_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Identify the real image type from its first bytes (do not trust the header).
const sniff = (b) => {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return "image/webp";
  return null;
};

export default async (req) => {
  const store = getStore({ name: "photos", consistency: "strong" });
  const id = new URL(req.url).pathname.split("/")[3]; // /api/photos/:id

  if (req.method === "GET") {
    if (!id || !UUID.test(id)) return fail(404, "Not found.");
    const entry = await store.getWithMetadata(id, { type: "arrayBuffer" });
    if (!entry) return fail(404, "Not found.");
    return new Response(entry.data, {
      headers: {
        "Content-Type": entry.metadata?.type || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (req.method === "POST" && !id) {
    const denied = await requireAdmin(req, { write: true });
    if (denied) return denied;
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_BYTES) return fail(413, "Photo is too large.");
    const type = sniff(bytes);
    if (!type) return fail(400, "Only JPEG, PNG or WebP photos are allowed.");
    const key = crypto.randomUUID();
    await store.set(key, bytes, { metadata: { type } });
    return json({ url: `/api/photos/${key}` }, 201);
  }

  return fail(405, "Method not allowed.");
};

export const config = { path: ["/api/photos", "/api/photos/:id"] };
