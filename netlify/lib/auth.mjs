import { getUser } from "@netlify/identity";
import { ADMIN_EMAIL, normalizeEmail } from "./config.mjs";
import { fail, sameOrigin } from "./http.mjs";

export const isShopAdmin = (user) =>
  normalizeEmail(user?.email) === ADMIN_EMAIL && user.roles?.includes("admin") === true;

export const currentAdmin = async () => {
  const user = await getUser();
  return { user, isAdmin: isShopAdmin(user) };
};

// Guard for admin-only endpoints. Returns a Response to send, or null if allowed.
export const requireAdmin = async (req, { write = false } = {}) => {
  if (write && !sameOrigin(req)) return fail(403, "Cross-site request blocked.");
  const { user, isAdmin } = await currentAdmin();
  if (!user) return fail(401, "Please sign in.");
  if (!isAdmin) return fail(403, "This account is not the shop admin.");
  return null;
};
