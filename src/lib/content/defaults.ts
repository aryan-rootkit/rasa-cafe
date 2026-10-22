import {
  DEFAULT_MENU_CATEGORIES,
  type ContentDatabase,
  type Favourite,
  type MenuCategory,
  type MenuItem,
} from "./schema";

const SEED_DATE = "2026-09-29T00:00:00.000Z";

/** RASA's Google Maps listing; admins can change it in Website Settings. */
export const DEFAULT_MAPS_URL = "https://maps.app.goo.gl/DQXs4t35YmWhUxjX6";
export const DEFAULT_ADDRESS =
  "Shop BG-32, Ground Floor, Behind Punjab National Bank, Destination Center, Magarpatta City, Pune - 411013";

const menuCategories: MenuCategory[] = DEFAULT_MENU_CATEGORIES.map(({ id, label }, position) => ({
  id,
  label,
  position,
  createdAt: SEED_DATE,
  updatedAt: SEED_DATE,
}));

/**
 * Favourites used to be the visible, featured menu items with a photo; those
 * items start the admin-managed Favourites list.
 */
export function favouritesFromMenu(items: MenuItem[], newId: (index: number) => string): Favourite[] {
  return items
    .filter((item) => item.isVisible && item.isFeatured && item.imageUrl)
    .map((item, position) => ({
      id: newId(position),
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      position,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
}

/**
 * What a new database starts with: contact details and the starter menu
 * categories. Photos, menu items and favourites are all added from the admin.
 */
export function createDefaultContent(): ContentDatabase {
  return structuredClone({
    version: 1,
    settings: {
      instagramUrl: "https://www.instagram.com/rasa.pune",
      mapsUrl: DEFAULT_MAPS_URL,
      email: "connect@rasacafe.in",
      phone1: "9890999285",
      phone2: "7755990957",
      address: DEFAULT_ADDRESS,
      openingDays: "MON — SUN",
      openingHours: "10:00 AM — 11:00 PM",
      updatedAt: SEED_DATE,
    },
    heroImages: [],
    menuCategories,
    menuItems: [],
    favourites: [],
    storyImages: [],
  });
}
