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
- **Hero Gallery** (`/admin/images`) — the 10-image moving gallery: upload, replace, delete, reorder (drag or arrows), alt text, show/hide
- **RASA Favourites** (`/admin/favourites`) — the cards in *The RASA favourites*: add, edit (photo, name, description, with a live preview), delete, reorder (drag or arrows, saved immediately). No limit on how many; prices are never shown in this section
- **Our Story Gallery** (`/admin/story`) — the scrolling café photos in *Our Story*: upload (several at once), preview before publishing, replace, delete, reorder, optional alt text. No limit on how many; with no photos the section shows just the story text
- **Menu** — add, edit, delete, photo, category, price, visibility
- **Users** — see everyone who can sign in and remove accounts

Saving in the admin revalidates `/` and `/menu`, so changes appear on the next page load.

## Content and storage

- **MongoDB** holds all data: `admin_users`, `settings`, `hero_images`, `menu_items`, `favourites`, `story_images` and `app_config`. `src/lib/content/store.ts` is the only module that reads or writes it; the cached connection lives in `src/lib/db/mongodb.ts`.
- On first run an empty database gets the contact details and starter menu categories from `src/lib/content/defaults.ts`; there is no sample menu or photography, so everything shown is added from the admin. Sections with nothing to show either hide (hero photos, favourites, story gallery) or say the menu is coming soon. Without `MONGODB_URI` the public site renders those defaults read-only.
- One-off migrations run automatically on the first request after a deploy, once per database (markers in `app_config`). `migration:favourites-v1` copies the visible featured menu items into `favourites`, so the existing favourites stay; menu items, prices and the old `isFeatured` flag are left untouched. `migration:location-2026-10` sets the new address and Google Maps link in Website Settings. `migration:remove-sample-content-v1` deletes the sample photos from the first seed (any hero, favourite or story entry still pointing at the removed `/images/...` files) and the sample menu items that were never edited in the admin.
- Menu categories are managed in the admin; `src/lib/content/categories.ts` lists the ones a new database starts with.
- **Uploaded images** are stored in MongoDB **GridFS** (`fs.files` + `fs.chunks`) by `src/lib/images.ts`. Hero, menu, favourite and story documents keep the GridFS file id (`fileId` / `imageFileId`) plus the public URL `/api/images/<id>`; story photos also store their pixel size so the gallery can keep each photo's shape.
- `POST /api/admin/images` (admins only) validates the actual bytes (JPG, PNG or WebP only, max 4 MB), strips metadata, resizes to at most 2400px and re-encodes as WebP. Photos over 4 MB are shrunk in the browser first, because Vercel rejects larger requests.
- `GET /api/images/<id>` streams the file from GridFS with long-lived immutable caching; pages render it through `next/image`, which serves resized versions. Replacing or deleting an image (or a menu item or favourite) deletes the old GridFS file once nothing else references it; uploads never saved are removed after an hour.
- Brand copy (tagline, intro) lives in `src/data/site.ts`. The **Get Directions** buttons open the Google Maps URL from Website Settings.

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
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run hash-password -- "…"` | Generate `ADMIN_PASSWORD_HASH` |
