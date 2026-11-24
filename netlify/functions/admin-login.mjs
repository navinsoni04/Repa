import { createHash, timingSafeEqual } from "node:crypto";
import { admin as identityAdmin, AuthError, login } from "@netlify/identity";
import { isShopAdmin } from "../lib/auth.mjs";
import { ADMIN_EMAIL, isOwnerEmail } from "../lib/config.mjs";
import { fail, json, readJson, sameOrigin } from "../lib/http.mjs";

const invalidCredentials = () => fail(401, "Email or password is incorrect.");
const digest = (value) => createHash("sha256").update(value).digest();
const matchesInitialPassword = (password) => {
  const configured = Netlify.env.get("ADMIN_DEFAULT_PASSWORD");
  return Boolean(configured) && timingSafeEqual(digest(password), digest(configured));
};
const credentialsRejected = (error) => error instanceof AuthError && [400, 401, 403].includes(error.status);
const loginUnavailable = (error) => error instanceof AuthError && error.status === 429
  ? fail(429, "Too many sign-in attempts. Please wait and try again.")
  : fail(503, "Sign-in is temporarily unavailable. Please try again.");

export default async (req, context) => {
  if (req.method !== "POST") return fail(405, "Method not allowed.");
  if (!sameOrigin(req)) return fail(403, "Cross-site request blocked.");

  const { value, error } = await readJson(req, 4_096);
  if (error) return error;
  const password = value?.password;
  if (!isOwnerEmail(value?.email) || typeof password !== "string" || !password) {
    return invalidCredentials();
  }

  let user;
  try {
    user = await login(ADMIN_EMAIL, password);
  } catch (error) {
    if (!credentialsRejected(error)) return loginUnavailable(error);
    if (!matchesInitialPassword(password)) return invalidCredentials();

    try {
      const owner = await identityAdmin.createUser({
        email: ADMIN_EMAIL,
        password,
        data: { app_metadata: { roles: ["admin"] } },
      });
      if (!isShopAdmin(owner)) {
        await identityAdmin.updateUser(owner.id, {
          app_metadata: { ...owner.appMetadata, roles: ["admin"] },
        });
      }
    } catch (error) {
      if (!(error instanceof AuthError) || ![400, 409, 422].includes(error.status)) {
        return loginUnavailable(error);
      }
    }

    try {
      user = await login(ADMIN_EMAIL, password);
    } catch (error) {
      return credentialsRejected(error) ? invalidCredentials() : loginUnavailable(error);
    }
  }

  if (!isShopAdmin(user)) {
    context.cookies.delete("nf_jwt");
    context.cookies.delete("nf_refresh");
    return invalidCredentials();
  }
  return json({ ok: true });
};

export const config = {
  path: "/api/admin/login",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip"] },
};
