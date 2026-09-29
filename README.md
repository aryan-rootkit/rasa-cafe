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

Create `.env.local` with your MongoDB Atlas connection string:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/rasacafe?retryWrites=true&w=majority
```

Open [http://localhost:3000](http://localhost:3000). The admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin) — it is not linked anywhere on the public site.

### Admin accounts

Open `/admin`, choose **Create account**, pick a username and a password (8+ characters) and you're in. **Anyone who opens the admin URL can create an account** with full access to the dashboard (limited to 5 sign-ups per IP every 15 minutes), so review accounts on the **Users** screen — removing someone signs them out immediately.

Accounts are stored in the MongoDB `admin_users` collection (`username`, `passwordHash`, `role`, `createdAt`, `updatedAt`; usernames are unique and lowercase). Passwords are stored only as bcrypt hashes and never reach the public site. Sessions are signed, `HttpOnly`, `SameSite=Strict` cookies that expire after 8 hours. Login attempts are rate-limited per IP.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | **Required.** MongoDB Atlas connection string. Server-side only — never prefix it with `NEXT_PUBLIC_`. |
| `MONGODB_DB` | Optional database name. Defaults to the one in the URI, or `rasacafe`. |
| `AUTH_SECRET` | Optional. 32+ random characters used to sign session cookies. If unset, a random key is generated once and kept in MongoDB (`app_config`). Changing it signs everyone out. |
| `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` | Optional extra owner account that can't be removed from the dashboard. Generate the hash with `npm run hash-password -- "your-strong-password"`. |
## What the admin can manage

- **Website Settings** — Instagram, Google Maps link, email, two phone numbers, address, opening hours
- **Hero Images** (`/admin/images`) — the 10-image moving gallery: upload, replace, delete, reorder (drag or arrows), alt text, show/hide
- **Menu** — add, edit, delete, photo, category, price, visibility, and "favourite" (featured items with a photo appear in *The RASA favourites*)
- **Users** — see everyone who can sign in and remove accounts

Saving in the admin revalidates `/` and `/menu`, so changes appear on the next page load.

## Content and storage

- **MongoDB** holds all data: `admin_users`, `settings`, `hero_images`, `menu_items` and `app_config`. `src/lib/content/store.ts` is the only module that reads or writes it; the cached connection lives in `src/lib/db/mongodb.ts`.
- On first run an empty database is filled with the seed content from `src/lib/content/defaults.ts`. Without `MONGODB_URI` the public site renders that seed content read-only.
- Menu categories are fixed in `src/lib/content/categories.ts`.
- **Uploaded images** are stored in MongoDB **GridFS** (`fs.files` + `fs.chunks`) by `src/lib/images.ts`. Hero and menu documents keep the GridFS file id (`fileId` / `imageFileId`) plus the public URL `/api/images/<id>`.
- `POST /api/admin/images` (admins only) validates the actual bytes (JPG, PNG or WebP only, max 4 MB), strips metadata, resizes to at most 2400px and re-encodes as WebP. Photos over 4 MB are shrunk in the browser first, because Vercel rejects larger requests.
- `GET /api/images/<id>` streams the file from GridFS with long-lived immutable caching; pages render it through `next/image`, which serves resized versions. Replacing or deleting an image (or a menu item) deletes the old GridFS file; uploads never saved are removed after an hour.
- The bundled default photos in `public/images` are served as static files until replaced from the admin.
- Brand copy (tagline, intro, Order of the Day) lives in `src/data/site.ts`.

### Deploying on Vercel

1. Add `MONGODB_URI` in **Settings → Environment Variables** for all environments.
2. In MongoDB Atlas → **Network Access**, allow `0.0.0.0/0` (Vercel has no fixed IPs).
3. Redeploy. No other storage service is needed; images are stored in MongoDB.

## Project structure

```
src/
  app/              Public pages (/, /menu), admin pages (/admin/*), API routes (/api/admin/*), public image route (/api/images/[id])
  components/       Public site sections
  components/admin/ Admin UI
  data/             Brand copy
  lib/auth/         Password hashing, sessions, route guards, rate limiting
  lib/content/      Content schema, seed data and store
  lib/db/           MongoDB connection and collection types
  proxy.ts          Redirects signed-out visitors away from /admin
public/images/      Seed photography
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run hash-password -- "…"` | Generate `ADMIN_PASSWORD_HASH` |
