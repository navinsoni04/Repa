// The ONE place the designated shop admin is configured.
// Only this account may use the admin dashboard. This is not a secret.
// (Intentionally NOT read from an environment variable, so a stale or
// mistyped dashboard variable can never lock the owner out again.)
export const ADMIN_EMAIL = "navinkumarsoni04@gmail.com";

export const isOwnerEmail = (email) =>
  typeof email === "string" && email.trim().toLowerCase() === ADMIN_EMAIL;
