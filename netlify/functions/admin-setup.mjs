import { admin as identityAdmin } from "@netlify/identity";
import { ADMIN_EMAIL, normalizeEmail } from "../lib/config.mjs";
import { fail, json, sameOrigin } from "../lib/http.mjs";

// POST /api/admin/setup
// Makes sure the designated shop admin account exists in Netlify Identity
// with the default password, so the owner can sign in without an invite.
//
// The default password is read from the ADMIN_DEFAULT_PASSWORD environment
// variable (never stored in this public repository). It is applied ONCE:
// after that the account is flagged, so a password the owner later changes
// via "Forgot password?" is never overwritten.
//
// It only ever touches the fixed ADMIN_EMAIL account and always answers the
// same way, so calling it reveals nothing and cannot affect anyone else.
const FLAG = "default_password_applied";

const findAdmin = async () => {
  const target = normalizeEmail(ADMIN_EMAIL);
  for (let page = 1; page <= 50; page++) {
    const users = await identityAdmin.listUsers({ page, perPage: 100 });
    const match = users.find((u) => normalizeEmail(u.email) === target);
    if (match) return match;
    if (users.length < 100) return null;
  }
  return null;
};

export default async (req) => {
  if (req.method !== "POST") return fail(405, "Method not allowed.");
  if (!sameOrigin(req)) return fail(403, "Cross-site request blocked.");

  const password = Netlify.env.get("ADMIN_DEFAULT_PASSWORD");
  if (!password) return json({ ok: true });

  try {
    const existing = await findAdmin();
    if (!existing) {
      await identityAdmin.createUser({
        email: ADMIN_EMAIL,
        password,
        data: { app_metadata: { roles: ["admin"], [FLAG]: true } },
      });
    } else if (!existing.appMetadata?.[FLAG]) {
      const roles = new Set([...(existing.roles ?? []), "admin"]);
      await identityAdmin.updateUser(existing.id, {
        password,
        confirm: true,
        app_metadata: { ...existing.appMetadata, roles: [...roles], [FLAG]: true },
      });
    }
  } catch (error) {
    console.error("Admin setup failed:", error?.message ?? error);
  }
  return json({ ok: true });
};

export const config = { path: "/api/admin/setup" };
