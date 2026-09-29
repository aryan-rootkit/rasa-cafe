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
cp .env.example .env.local   # then fill it in (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin) — it is not linked anywhere on the public site.

### Admin credentials

All secrets live in `.env.local` (never committed):

| Variable | Purpose |
| --- | --- |
| `ADMIN_USERNAME` | Admin sign-in name |
| `ADMIN_PASSWORD_HASH` | scrypt hash of the admin password — generate with `npm run hash-password -- "your-strong-password"` |
| `AUTH_SECRET` | 32+ random characters used to sign session cookies. Changing it signs everyone out. |
| `STORAGE_DIR` | Optional. Where `content.json` and uploads are kept (default `./storage`) |

Sessions are signed, `HttpOnly`, `SameSite=Strict` cookies that expire after 8 hours. Login attempts are rate-limited per IP.

### Admin accounts

The account in `.env.local` is the owner. **Anyone who opens `/admin/signup` can create their own admin account** with full access to the dashboard (limited to 5 sign-ups per IP every 15 minutes). Passwords are stored as scrypt hashes in `storage/content.json` and never reach the public site. Review accounts on the **Users** screen in the dashboard — removing someone signs them out immediately.

## What the admin can manage

- **Website Settings** — Instagram, Google Maps link, email, two phone numbers, address, opening hours
- **Hero Images** — the 10-image moving gallery: upload, replace, delete, reorder (drag or arrows), alt text, show/hide
- **Menu** — add, edit, delete, photo, category, price, visibility, and "favourite" (featured items with a photo appear in *The RASA favourites*)
- **Users** — see everyone who can sign in and remove accounts

Saving in the admin revalidates `/` and `/menu`, so changes appear on the next page load.

## Content and storage

- `src/lib/content/store.ts` is the only module that reads or writes content. It uses a JSON file (`storage/content.json`); swapping in a database means reimplementing that module.
- On first run (no `content.json` yet) the site uses the seed content in `src/lib/content/defaults.ts`.
- Uploads are validated by their actual bytes (JPG, PNG or WebP only, max 8 MB), stripped of metadata, resized to at most 2400px and re-encoded as WebP in `storage/uploads/`, then served from `/media/<id>.webp`. Unused uploads are cleaned up automatically.
- Brand copy (tagline, intro, Order of the Day) lives in `src/data/site.ts`.

> **Hosting note:** content and uploads are stored on the server's disk, so deploy somewhere with a persistent filesystem (a VPS, Railway/Render with a volume, etc.) and back up the `storage/` folder. Serverless hosts like Vercel wipe the disk between deploys — use a database and object storage there instead.

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
