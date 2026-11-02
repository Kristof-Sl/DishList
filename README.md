# Dishlist

Shared list of places to eat (to try / tried) for two people. Vite + React + TypeScript, Supabase (database + login), hosted on Vercel. Place search uses OpenStreetMap (Nominatim). UI is Dutch by default, with English and 3 styles under the ⚙ button.

## Setup

### 1. Supabase
1. supabase.com → **New project** (free plan). Wait until it is ready. (Free plan allows 2 active projects; alternatively reuse your MeepleSync project, the table names don't clash.)
2. **SQL Editor** → run `supabase/schema.sql`, then run `supabase/photos.sql` (photos + storage bucket).
3. **Project Settings → API**: copy the *Project URL* and the *anon public* key.
4. **Authentication → Providers → Email**: switch **off** "Confirm email" (no email sending needed).

### 2. Run locally (optional)
```
npm install
cp .env.example .env     # fill in URL and anon key
npm run dev
```

### 3. GitHub
Create an empty repo (e.g. `dishlist`), then in GitHub Desktop: *File → Add local repository* (this folder) → commit → publish.

### 4. Vercel
1. vercel.com → **Add New → Project** → import the repo (Framework: Vite is detected).
2. Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Deploy.
3. In Supabase **Authentication → URL Configuration**, set *Site URL* to your Vercel URL.

### 5. Accounts
Open the site, tap **Account maken** with your email + password. Your partner does the same. Then in Supabase **Authentication → Sign In / Providers**, switch **off** "Allow new users to sign up" so nobody else can join. (The database lets any logged-in user see everything, which is the sharing model.)

### 6. iPhone / iPad
Open the site in Safari → Share → **Add to Home Screen**. Log in once inside the installed app; you stay logged in afterwards.

## Notes
- Nominatim allows light use only (one search per tap, no autocomplete). Don't loop requests.
- Places without coordinates (manual entries) are hidden by the "near me" filter.
- Free Supabase projects pause after about a week of inactivity; resume from the dashboard.

## Upgrading from version 1
Run `supabase/visit_fields.sql` in the Supabase SQL Editor to add the new visit fields, run `supabase/photos.sql` once, replace the code, run `npm install` (adds Leaflet), commit and push.

## Not yet included
"Near a chosen city" filter. Photos are shrunk to max 1600 px on your device (about 300 KB each), so the free 1 GB goes a long way.
