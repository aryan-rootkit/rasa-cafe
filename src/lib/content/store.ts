import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { MongoServerError, ObjectId, type WithId } from "mongodb";
import {
  collections,
  type AdminUserDoc,
  type HeroImageDoc,
  type MenuItemDoc,
} from "@/lib/db/collections";
import { databaseConfigured } from "@/lib/db/mongodb";
import { createDefaultContent } from "./defaults";
import {
  HERO_IMAGE_LIMIT,
  type AdminUser,
  type HeroImage,
  type HeroImageInput,
  type MenuItem,
  type MenuItemInput,
  type PublicAdminUser,
  type SettingsInput,
  type SiteContent,
  type WebsiteSettings,
} from "./schema";

/**
 * MongoDB-backed content store. Every read/write goes through this module.
 * Without MONGODB_URI (e.g. a fresh clone) reads return the seed content.
 */

const toHero = ({ _id, ...rest }: WithId<HeroImageDoc>): HeroImage => ({ id: _id, ...rest });
const toMenuItem = ({ _id, ...rest }: WithId<MenuItemDoc>): MenuItem => ({ id: _id, ...rest });
const toAdminUser = (doc: AdminUserDoc): AdminUser => ({
  id: doc._id.toHexString(),
  username: doc.username,
  passwordHash: doc.passwordHash,
  role: doc.role,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

let seeded: Promise<void> | undefined;

/** Fills an empty database with the seed content, exactly once across all instances. */
async function db() {
  const c = await collections();
  seeded ??= (async () => {
    const marker = await c.appConfig.updateOne(
      { _id: "seed" },
      { $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    if (!marker.upsertedCount) return;

    const seed = createDefaultContent();
    await Promise.all([
      c.settings.insertOne({ _id: "site", ...seed.settings }),
      c.heroImages.insertMany(seed.heroImages.map(({ id, ...rest }) => ({ _id: id, ...rest }))),
      c.menuItems.insertMany(seed.menuItems.map(({ id, ...rest }) => ({ _id: id, ...rest }))),
    ]);
  })().catch((error) => {
    seeded = undefined;
    throw error;
  });
  await seeded;
  return c;
}

let cachedSecret: string | undefined;

/** Session signing key, generated once and kept in `app_config`. */
export async function getStoredAuthSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  const c = await collections();
  await c.appConfig.updateOne(
    { _id: "authSecret" },
    { $setOnInsert: { value: randomBytes(48).toString("base64url"), createdAt: new Date() } },
    { upsert: true }
  );
  const doc = await c.appConfig.findOne({ _id: "authSecret" });
  if (!doc?.value) throw new Error("Couldn't load the session key.");
  cachedSecret = doc.value;
  return cachedSecret;
}

export async function getContent(): Promise<SiteContent> {
  if (!databaseConfigured) {
    const { settings, heroImages, menuItems } = createDefaultContent();
    return { settings, heroImages, menuItems };
  }
  const c = await db();
  const [settings, heroImages, menuItems] = await Promise.all([
    getSettings(),
    c.heroImages.find().sort({ position: 1 }).toArray(),
    c.menuItems.find().sort({ position: 1 }).toArray(),
  ]);
  return { settings, heroImages: heroImages.map(toHero), menuItems: menuItems.map(toMenuItem) };
}

export async function getSettings(): Promise<WebsiteSettings> {
  if (!databaseConfigured) return createDefaultContent().settings;
  const doc = await (await db()).settings.findOne(
    { _id: "site" },
    { projection: { _id: 0 } }
  );
  return doc ?? createDefaultContent().settings;
}

export async function updateSettings(input: SettingsInput): Promise<WebsiteSettings> {
  const settings: WebsiteSettings = { ...input, updatedAt: new Date().toISOString() };
  await (await db()).settings.replaceOne({ _id: "site" }, settings, { upsert: true });
  return settings;
}

export async function getPublicHeroImages(): Promise<HeroImage[]> {
  const { heroImages } = await getContent();
  return heroImages.filter((img) => img.isActive).slice(0, HERO_IMAGE_LIMIT);
}

/** Replaces the whole hero list; array order becomes display order. */
export async function saveHeroImages(input: HeroImageInput[]): Promise<HeroImage[]> {
  const c = await db();
  const now = new Date().toISOString();
  const existing = new Map(
    (await c.heroImages.find().toArray()).map((doc) => [doc._id, doc])
  );

  const images: HeroImage[] = input.slice(0, HERO_IMAGE_LIMIT).map((item, position) => {
    const prev = item.id ? existing.get(item.id) : undefined;
    const changed =
      !prev ||
      prev.imageUrl !== item.imageUrl ||
      prev.altText !== item.altText ||
      prev.isActive !== item.isActive ||
      prev.position !== position;
    return {
      id: prev?._id ?? randomUUID(),
      imageUrl: item.imageUrl,
      altText: item.altText,
      isActive: item.isActive,
      position,
      createdAt: prev?.createdAt ?? now,
      updatedAt: changed ? now : prev.updatedAt,
    };
  });

  await c.heroImages.bulkWrite([
    { deleteMany: { filter: { _id: { $nin: images.map((img) => img.id) } } } },
    ...images.map(({ id, ...rest }) => ({
      replaceOne: { filter: { _id: id }, replacement: rest, upsert: true },
    })),
  ]);
  return images;
}

export async function getMenuItems(): Promise<MenuItem[]> {
  return (await getContent()).menuItems;
}

export async function getVisibleMenuItems(): Promise<MenuItem[]> {
  return (await getMenuItems()).filter((item) => item.isVisible);
}

export async function createMenuItem(input: MenuItemInput): Promise<MenuItem> {
  const c = await db();
  const last = await c.menuItems.find().sort({ position: -1 }).limit(1).next();
  const now = new Date().toISOString();
  const item: MenuItem = {
    ...input,
    id: randomUUID(),
    position: (last?.position ?? -1) + 1,
    createdAt: now,
    updatedAt: now,
  };
  const { id, ...doc } = item;
  await c.menuItems.insertOne({ _id: id, ...doc });
  return item;
}

export async function updateMenuItem(id: string, input: MenuItemInput): Promise<MenuItem | null> {
  const doc = await (await db()).menuItems.findOneAndUpdate(
    { _id: id },
    { $set: { ...input, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  return doc ? toMenuItem(doc) : null;
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  return (await (await db()).menuItems.deleteOne({ _id: id })).deletedCount > 0;
}

export async function findAdminUserByUsername(username: string): Promise<AdminUser | null> {
  const doc = await (await collections()).adminUsers.findOne({
    username: username.toLowerCase(),
  });
  return doc ? toAdminUser(doc) : null;
}

export async function findAdminUserById(id: string): Promise<AdminUser | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await (await collections()).adminUsers.findOne({ _id: new ObjectId(id) });
  return doc ? toAdminUser(doc) : null;
}

export async function listAdminUsers(): Promise<PublicAdminUser[]> {
  const docs = await (await collections()).adminUsers
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: 1 })
    .toArray();
  return docs.map((doc) => ({
    id: doc._id.toHexString(),
    username: doc.username,
    createdAt: doc.createdAt.toISOString(),
  }));
}

/** Returns null when the username is already taken. */
export async function createAdminUser(
  username: string,
  passwordHash: string
): Promise<AdminUser | null> {
  const now = new Date();
  const doc: AdminUserDoc = {
    _id: new ObjectId(),
    username: username.toLowerCase(),
    passwordHash,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  };
  try {
    await (await collections()).adminUsers.insertOne(doc);
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return null;
    throw error;
  }
  return toAdminUser(doc);
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await (await collections()).adminUsers.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

/** Every uploaded media URL currently referenced by saved content. */
export async function getReferencedMedia(): Promise<Set<string>> {
  const c = await db();
  const [hero, menu] = await Promise.all([
    c.heroImages.distinct("imageUrl"),
    c.menuItems.distinct("imageUrl"),
  ]);
  return new Set([...hero, ...menu].filter((url) => url.startsWith("/media/")));
}
