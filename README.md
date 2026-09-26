# RASA Café

Premium landing site for **RASA** — a warm, editorial café brand.

**Food. Coffee. Moments.**

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/              # Layout + homepage
  components/       # Section UI
  data/             # Products, menu, site copy
  lib/              # Helpers
public/images/      # Hero, product, and story photography
```

## Editing content

All menu, product, and café details live in `src/data/site.ts`.

- **Order of the day** — update the `orderOfTheDay` object
- **Top sellers** — edit `topSellers`
- **Menu** — edit `menuCategories`
- **Address / hours / contact** — edit `siteInfo`
- **Images** — replace files under `public/images/` (keep the same paths)

## Scripts

| Command       | Description              |
| ------------- | ------------------------ |
| `npm run dev` | Development server       |
| `npm run build` | Production build       |
| `npm run start` | Start production server |
| `npm run lint`  | ESLint                 |
