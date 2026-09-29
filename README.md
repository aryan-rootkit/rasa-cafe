# RASA Café

Brand and menu showcase site for **RASA**, with a private admin panel for managing content. There is no ordering, cart or checkout — visitors explore, view the menu and find their way to the café.

**Food. Coffee. Moments.**

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS, Framer Motion, Lucide React
- zod for validation (shared by the admin UI and API), sharp for image processing

## Getting started

```bash
npm install
npm run dev
```

No environment variables are required.

Open [http://localhost:3000](http://localhost:3000). The admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin) — it is not linked anywhere on the public site.

### Admin accounts

Open `/admin`, choose **Create account**, pick a username and a password (8+ characters) and you're in. **Anyone who opens the admin URL can create an account** with full access to the dashboard (limited to 5 sign-ups per IP every 15 minutes), so review accounts on the **Users** screen — removing someone signs them out immediately.

Passwords are stored as scrypt hashes and never reach the public site. Sessions are signed, `HttpOnly`, `SameSite=Strict` cookies that expire after 8 hours. Login attempts are rate-limited per IP.

### Optional environment variables

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | 32+ random characters used to sign session cookies. If unset, a random key is generated once and kept in storage. Changing it signs everyone out. |
| `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` | An extra owner account that can't be removed from the dashboard. Generate the hash with `npm run hash-password -- "your-strong-password"`. |
| `STORAGE_DIR` | Where `content.json` and uploads are kept locally (default `./storage`) |
| `BLOB_READ_WRITE_TOKEN` | Set automatically when a Vercel Blob store is connected (see below) |

## What the admin can manage

- **Website Settings** — Instagram, Google Maps link, email, two phone numbers, address, opening hours
- **Hero Images** — the 10-image moving gallery: upload, replace, delete, reorder (drag or arrows), alt text, show/hide
- **Menu** — add, edit, delete, photo, category, price, visibility, and "favourite" (featured items with a photo appear in *The RASA favourites*)
- **Users** — see everyone who can sign in and remove accounts

Saving in the admin revalidates `/` and `/menu`, so changes appear on the next page load.

## Content and storage

- `src/lib/content/store.ts` is the only module that reads or writes content. It keeps everything in one JSON file, `content.json`.
- `src/lib/storage.ts` decides where files live: a private **Vercel Blob** store when one is connected, otherwise the local `storage/` folder.
- On first run (no `content.json` yet) the site uses the seed content in `src/lib/content/defaults.ts`.
- Uploads are validated by their actual bytes (JPG, PNG or WebP only), stripped of metadata, resized to at most 2400px and re-encoded as WebP, then served from `/media/<id>.webp`. Photos over 4 MB are shrunk in the browser first, because Vercel rejects larger requests. Unused uploads are cleaned up automatically.
- Brand copy (tagline, intro, Order of the Day) lives in `src/data/site.ts`.

### Deploying on Vercel

Vercel's disk is read-only, so the admin needs a Blob store to save anything:

1. In the Vercel dashboard, open the project → **Storage** → **Create Database** → **Blob**, choose **Private** access, and connect it to the project (all environments).
2. Redeploy. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically.

Until a store is connected the public site still works with the seed content, and the admin sign-in screen says storage isn't connected.

On any other host with a persistent disk (a VPS, Railway/Render with a volume), no setup is needed; back up the `storage/` folder.

## Project structure

```
src/
  app/              Public pages (/, /menu), admin pages (/admin/*), API routes (/api/admin/*), media route
  components/       Public site sections
  components/admin/ Admin UI
  data/             Brand copy
  lib/auth/         Password hashing, sessions, route guards, rate limiting
  lib/content/      Content schema, seed data and store
  proxy.ts          Redirects signed-out visitors away from /admin
public/images/      Seed photography
storage/            Admin-managed content and uploads (gitignored)
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run hash-password -- "…"` | Generate `ADMIN_PASSWORD_HASH` |
