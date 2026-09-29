import "server-only";

import type { ObjectId } from "mongodb";
import type { HeroImage, MenuItem, WebsiteSettings } from "@/lib/content/schema";
import { getDb } from "./mongodb";

/** `admin_users` collection. Usernames are stored lowercase and are unique. */
export type AdminUserDoc = {
  _id: ObjectId;
  username: string;
  /** bcrypt hash; the plain password is never stored. */
  passwordHash: string;
  role: "admin";
  createdAt: Date;
  updatedAt: Date;
};

/** `settings` collection: a single document with `_id: "site"`. */
export type SettingsDoc = WebsiteSettings & { _id: "site" };

/** `hero_images` and `menu_items`: `_id` is the item's UUID. */
export type HeroImageDoc = Omit<HeroImage, "id"> & { _id: string };
export type MenuItemDoc = Omit<MenuItem, "id"> & { _id: string };

/** `app_config`: internal values such as the generated session key and the seed marker. */
export type AppConfigDoc = { _id: string; value?: string; createdAt: Date };

let indexesReady: Promise<unknown> | undefined;

export async function collections() {
  const db = await getDb();
  const c = {
    adminUsers: db.collection<AdminUserDoc>("admin_users"),
    settings: db.collection<SettingsDoc>("settings"),
    heroImages: db.collection<HeroImageDoc>("hero_images"),
    menuItems: db.collection<MenuItemDoc>("menu_items"),
    appConfig: db.collection<AppConfigDoc>("app_config"),
  };

  indexesReady ??= Promise.all([
    c.adminUsers.createIndex({ username: 1 }, { unique: true }),
    c.heroImages.createIndex({ position: 1 }),
    c.menuItems.createIndex({ position: 1 }),
  ]).catch((error) => {
    indexesReady = undefined;
    throw error;
  });
  await indexesReady;

  return c;
}