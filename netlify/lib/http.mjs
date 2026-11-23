const BASE = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...BASE, "Content-Type": "application/json; charset=utf-8", ...extra },
  });

export const fail = (status, message) => json({ message }, status);

export const readJson = async (req, maxBytes = 6_000_000) => {
  const text = await req.text();
  if (text.length > maxBytes) return { error: fail(413, "Request is too large.") };
  try {
    return { value: JSON.parse(text) };
  } catch {
    return { error: fail(400, "Invalid request.") };
  }
};

// Browsers always send Origin on cross-site writes; reject if it is not this site.
export const sameOrigin = (req) => {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
};
