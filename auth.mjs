import { getUser } from "@netlify/identity";
import { ADMIN_EMAIL, normalizeEmail } from "./config.mjs";
import { fail, sameOrigin } from "./http.mjs";

// Returns { user, isAdmin }. user is null when nobody is signed in.
// isAdmin requires a valid Identity session (verified server-side by
// @netlify/identity) AND that the account email is the designated shop admin.
export const currentAdmin = async () => {
  const user = await getUser();
  if (!user) return { user: null, isAdmin: false };
  const isAdmin = normalizeEmail(user.email) === normalizeEmail(ADMIN_EMAIL);
  return { user, isAdmin };
};

// Guard for admin-only endpoints. Returns a Response to send, or null if allowed.
export const requireAdmin = async (req, { write = false } = {}) => {
  if (write && !sameOrigin(req)) return fail(403, "Cross-site request blocked.");
  const { user, isAdmin } = await currentAdmin();
  if (!user) return fail(401, "Please sign in.");
  if (!isAdmin) return fail(403, "This account is not the shop admin.");
  return null;
};
