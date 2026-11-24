# MS Jewellers — deploy guide

Admin account (only this email can use the dashboard): navinkumarsoni04@gmail.com
It is set in `netlify/lib/config.mjs` (not an env variable, not a secret).

## 1. Upload the project (NOT drag & drop)
Drag-and-drop deploys skip Functions and the Database. Use one of:
- Git: push this folder to GitHub, then Netlify -> Add new project -> Import from Git, OR
- CLI: `npm i -g netlify-cli && npm install && netlify deploy --prod`
Build command: leave empty. Publish directory: `public`.

## 2. Configure admin sign-in
The project uses Netlify Identity. The backend blocks self-registration and sign-in with
any email other than the designated owner. Catalog browsing and review submission remain public.
Set `ADMIN_DEFAULT_PASSWORD` as a secret available to Netlify Functions in the deploy
contexts where first sign-in is needed. Never commit or share the password.

## 3. Database
Nothing to do. `@netlify/database` is in package.json, and the migration in
`netlify/database/migrations/` creates the `catalog` and `reviews` tables
automatically on deploy. Check Netlify -> Deploys -> Deploy log for "migration".

## 4. Log in
Open **Admin** on the site and sign in with the designated email and the initial
password. The first successful sign-in creates the Identity account with the `admin`
role. If the Identity account already exists, it needs the `admin` role and its existing
password. The initial password never overwrites an existing account's password.
Use **Forgot password?** to choose a new password by email, especially after first sign-in.

## Remove old settings
Netlify -> Environment variables: delete any old admin-email/role variables
(they are no longer used). Remove the old `npm run bundle:identity` build command.
