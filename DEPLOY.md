# MS Jewellers — deploy guide

Admin account (only this email can use the dashboard): navinkumarsoni04@gmail.com
It is set in `netlify/lib/config.mjs` (not an env variable, not a secret).

## 1. Upload the project (NOT drag & drop)
Drag-and-drop deploys skip Functions and the Database. Use one of:
- Git: push this folder to GitHub, then Netlify -> Add new project -> Import from Git, OR
- CLI: `npm i -g netlify-cli && npm install && netlify deploy --prod`
Build command: leave empty. Publish directory: `public`.

## 2. Turn on Identity (login)
Netlify -> your site -> Project configuration -> Identity -> Enable.
- Registration preferences: **Invite only**
- Leave "Autoconfirm" OFF
Then Identity -> Invite users -> `navinkumarsoni04@gmail.com`.
Open the invite email, click the link (it opens your site), set a password.

## 3. Database
Nothing to do. `@netlify/database` is in package.json, and the migration in
`netlify/database/migrations/` creates the `catalog` and `reviews` tables
automatically on deploy. Check Netlify -> Deploys -> Deploy log for "migration".

## 4. Log in
Site -> Admin -> sign in with the email + password from step 2.
If the invite email already was used before, use "Forgot password?".

## Remove old settings
Netlify -> Environment variables: delete any old admin-email/role variables
(they are no longer used). Remove the old `npm run bundle:identity` build command.
