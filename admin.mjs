import { currentAdmin } from "../lib/auth.mjs";
import { fail, json } from "../lib/http.mjs";

// GET /api/admin -> { admin: true|false }; 401 when not signed in.
export default async (req) => {
  if (req.method !== "GET") return fail(405, "Method not allowed.");
  const { user, isAdmin } = await currentAdmin();
  if (!user) return fail(401, "Please sign in.");
  return json({ admin: isAdmin });
};

export const config = { path: "/api/admin" };
