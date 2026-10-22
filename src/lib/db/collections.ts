import "server-only";

import type { ObjectId } from "mongodb";
import type {
  Favourite,
  HeroImage,
  MenuCategory,
  MenuItem,
  StoryImage,
  WebsiteSettings,
} from "@/lib/content/schema";
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

/**
 * `hero_images`: `_id` is the item's UUID. `fileId` points at the GridFS
 * file; `imageUrl` is the
 * public URL derived from it.
 */
export type HeroImageDoc = Omit<HeroImage, "id"> & {
  _id: string;
  section: "hero";
  fileId?: ObjectId | null;
  filename?: string;
  contentType?: string;
};

/** `menu_categories`: `_id` is the category's slug, which menu items store in `category`. */
export type MenuCategoryDoc = Omit<MenuCategory, "id"> & { _id: string };

/** `menu_items`: `_id` is the item's UUID; `imageFileId` points at the GridFS file. */
export type MenuItemDoc = Omit<MenuItem, "id"> & {
  _id: string;
  imageFileId?: ObjectId | null;
};

/** `favourites`: "The RASA favourites" on the homepage. `_id` is the UUID; `imageFileId` points at the GridFS file. */
export type FavouriteDoc = Omit<Favourite, "id"> & {
  _id: string;
  imageFileId?: ObjectId | null;
};

/** `story_images`: the Our Story gallery. `_id` is the UUID; `fileId` points at the GridFS file. */
export type StoryImageDoc = Omit<StoryImage, "id"> & {
  _id: string;
  fileId?: ObjectId | null;
};

/** `app_config`: internal values such as the generated session key and the seed/migration markers. */
export type AppConfigDoc = { _id: string; value?: string; createdAt: Date };

let indexesReady: Promise<unknown> | undefined;

export async function collections() {
  const db = await getDb();
  const c = {
    adminUsers: db.collection<AdminUserDoc>("admin_users"),
    settings: db.collection<SettingsDoc>("settings"),
    heroImages: db.collection<HeroImageDoc>("hero_images"),
    menuCategories: db.collection<MenuCategoryDoc>("menu_categories"),
    menuItems: db.collection<MenuItemDoc>("menu_items"),
    favourites: db.collection<FavouriteDoc>("favourites"),
    storyImages: db.collection<StoryImageDoc>("story_images"),
    appConfig: db.collection<AppConfigDoc>("app_config"),
  };

  indexesReady ??= Promise.all([
    c.adminUsers.createIndex({ username: 1 }, { unique: true }),
    c.heroImages.createIndex({ position: 1 }),
    c.menuCategories.createIndex({ position: 1 }),
    c.menuItems.createIndex({ position: 1 }),
    c.favourites.createIndex({ position: 1 }),
    c.storyImages.createIndex({ position: 1 }),
  ]).catch((error) => {
    indexesReady = undefined;
    throw error;
  });
  await indexesReady;

  return c;
}