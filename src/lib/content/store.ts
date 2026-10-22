import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { MongoServerError, ObjectId, type WithId } from "mongodb";
import {
  collections,
  type AdminUserDoc,
  type FavouriteDoc,
  type HeroImageDoc,
  type MenuCategoryDoc,
  type MenuItemDoc,
  type StoryImageDoc,
} from "@/lib/db/collections";
import { databaseConfigured } from "@/lib/db/mongodb";
import { fileIdFromUrl, getImageFileInfo, pruneUnusedImages } from "@/lib/images";
import { categoryIdFromLabel } from "./categories";
import { createDefaultContent, DEFAULT_ADDRESS, DEFAULT_MAPS_URL, favouritesFromMenu } from "./defaults";
import {
  HERO_IMAGE_LIMIT,
  type AdminUser,
  type Favourite,
  type FavouriteInput,
  type HeroImage,
  type HeroImageInput,
  type MenuCategory,
  type MenuItem,
  type MenuItemInput,
  type PublicAdminUser,
  type SettingsInput,
  type SiteContent,
  type StoryImage,
  type StoryImageInput,
  type WebsiteSettings,
} from "./schema";

/**
 * MongoDB-backed content store. Every read/write goes through this module.
 * Without MONGODB_URI (e.g. a fresh clone) reads return the seed content.
 */

const toHero = (d: WithId<HeroImageDoc>): HeroImage => ({
  id: d._id,
  imageUrl: d.imageUrl,
  altText: d.altText,
  position: d.position,
  isActive: d.isActive,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});
const toMenuCategory = (d: WithId<MenuCategoryDoc>): MenuCategory => ({
  id: d._id,
  label: d.label,
  position: d.position,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});
const toMenuItem = (d: WithId<MenuItemDoc>): MenuItem => ({
  id: d._id,
  name: d.name,
  description: d.description,
  category: d.category,
  price: d.price,
  imageUrl: d.imageUrl,
  isVisible: d.isVisible,
  isFeatured: d.isFeatured,
  position: d.position,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

const toFavourite = (d: WithId<FavouriteDoc>): Favourite => ({
  id: d._id,
  name: d.name,
  description: d.description,
  imageUrl: d.imageUrl,
  position: d.position,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});
const toStoryImage = (d: WithId<StoryImageDoc>): StoryImage => ({
  id: d._id,
  imageUrl: d.imageUrl,
  altText: d.altText,
  width: d.width ?? null,
  height: d.height ?? null,
  position: d.position,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

const toFileId = (url: string) => {
  const id = fileIdFromUrl(url);
  return id ? new ObjectId(id) : null;
};

function toHeroDoc(
  { id, ...image }: HeroImage,
  info?: { filename: string; contentType: string }
): HeroImageDoc {
  const filename = info?.filename ?? image.imageUrl.split("/").pop() ?? "";
  return {
    _id: id,
    ...image,
    section: "hero",
    fileId: toFileId(image.imageUrl),
    filename,
    contentType:
      info?.contentType ?? (/\.png$/i.test(filename) ? "image/png" : filename.endsWith(".webp") ? "image/webp" : "image/jpeg"),
  };
}

const toMenuDoc = ({ id, ...item }: MenuItem): MenuItemDoc => ({
  _id: id,
  ...item,
  imageFileId: toFileId(item.imageUrl),
});

const toFavouriteDoc = ({ id, ...item }: Favourite): FavouriteDoc => ({
  _id: id,
  ...item,
  imageFileId: toFileId(item.imageUrl),
});

const toStoryDoc = ({ id, ...image }: StoryImage): StoryImageDoc => ({
  _id: id,
  ...image,
  fileId: toFileId(image.imageUrl),
});

/** Deletes GridFS files that are no longer used; never fails the save that triggered it. */
async function cleanUpImages(replaced: string[]) {
  try {
    await pruneUnusedImages(await getReferencedImageIds(), replaced);
  } catch (error) {
    console.error("Image clean-up failed", error);
  }
}
const toAdminUser = (doc: AdminUserDoc): AdminUser => ({
  id: doc._id.toHexString(),
  username: doc.username,
  passwordHash: doc.passwordHash,
  role: doc.role,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

let seeded: Promise<void> | undefined;

type Collections = Awaited<ReturnType<typeof collections>>;

/**
 * One-off, non-destructive data migrations, each run once across all
 * instances (guarded by an `app_config` marker that is removed again if the
 * migration fails, so it is retried).
 */
async function migrate(c: Collections) {
  await runOnce(c, "migration:favourites-v1", async () => {
    // Favourites used to be the featured menu items. Copy them into their own
    // collection; the menu items (and their prices) are left untouched.
    if (await c.favourites.countDocuments({}, { limit: 1 })) return;
    const menu = await c.menuItems.find().sort({ position: 1 }).toArray();
    const favourites = favouritesFromMenu(menu.map(toMenuItem), () => randomUUID());
    if (favourites.length) await c.favourites.insertMany(favourites.map(toFavouriteDoc));
  });

  await runOnce(c, "migration:menu-categories-v1", async () => {
    // Categories used to be fixed in code. Store them so admins can add and
    // rename them, keeping any category a saved item already uses.
    if (await c.menuCategories.countDocuments({}, { limit: 1 })) return;
    const categories = [...createDefaultContent().menuCategories];
    const known = new Set(categories.map((cat) => cat.id));
    const now = new Date().toISOString();
    for (const id of await c.menuItems.distinct("category")) {
      if (known.has(id)) continue;
      known.add(id);
      const label = id.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
      categories.push({ id, label, position: categories.length, createdAt: now, updatedAt: now });
    }
    await c.menuCategories.insertMany(categories.map(({ id, ...cat }) => ({ _id: id, ...cat })));
  });

  await runOnce(c, "migration:location-2026-10", async () => {
    // The café's address and Maps listing changed; both stay editable in Website Settings.
    await c.settings.updateOne(
      { _id: "site" },
      { $set: { address: DEFAULT_ADDRESS, mapsUrl: DEFAULT_MAPS_URL, updatedAt: new Date().toISOString() } }
    );
  });

  await runOnce(c, "migration:remove-sample-content-v1", async () => {
    // The first deploy seeded sample photos (bundled under /images, now removed)
    // and a sample menu. Drop the sample photos and any sample menu item an
    // admin never edited; everything uploaded or edited in the admin stays.
    const bundled = { $regex: "^/images/" };
    await Promise.all([
      c.heroImages.deleteMany({ imageUrl: bundled }),
      c.favourites.deleteMany({ imageUrl: bundled }),
      c.storyImages.deleteMany({ imageUrl: bundled }),
      c.menuItems.deleteMany({ _id: { $regex: SAMPLE_MENU_ID }, updatedAt: SEED_DATE }),
    ]);
    await c.menuItems.updateMany(
      { imageUrl: bundled },
      { $set: { imageUrl: "", imageFileId: null } }
    );
  });
}

/** Ids and timestamp the original sample menu was seeded with. */
const SAMPLE_MENU_ID = "^10000000-0000-4000-8000-0000000000\\d{2}$";
const SEED_DATE = "2026-09-29T00:00:00.000Z";

async function runOnce(c: Collections, id: string, run: () => Promise<void>) {
  const marker = await c.appConfig.updateOne(
    { _id: id },
    { $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  if (!marker.upsertedCount) return;
  try {
    await run();
  } catch (error) {
    await c.appConfig.deleteOne({ _id: id }).catch(() => {});
    throw error;
  }
}

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

    await c.settings.insertOne({ _id: "site", ...createDefaultContent().settings });
  })()
    .then(() => migrate(c))
    .catch((error) => {
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
    const { settings, heroImages, menuCategories, menuItems, favourites, storyImages } =
      createDefaultContent();
    return { settings, heroImages, menuCategories, menuItems, favourites, storyImages };
  }
  const c = await db();
  const [settings, heroImages, menuCategories, menuItems, favourites, storyImages] = await Promise.all([
    getSettings(),
    c.heroImages.find().sort({ position: 1 }).toArray(),
    c.menuCategories.find().sort({ position: 1 }).toArray(),
    c.menuItems.find().sort({ position: 1 }).toArray(),
    c.favourites.find().sort({ position: 1 }).toArray(),
    c.storyImages.find().sort({ position: 1 }).toArray(),
  ]);
  return {
    settings,
    heroImages: heroImages.map(toHero),
    menuCategories: menuCategories.map(toMenuCategory),
    menuItems: menuItems.map(toMenuItem),
    favourites: favourites.map(toFavourite),
    storyImages: storyImages.map(toStoryImage),
  };
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

  const fileInfo = await getImageFileInfo(
    images.map((img) => fileIdFromUrl(img.imageUrl)).filter((id): id is string => Boolean(id))
  );
  await c.heroImages.bulkWrite([
    { deleteMany: { filter: { _id: { $nin: images.map((img) => img.id) } } } },
    ...images.map((img) => {
      const { _id, ...replacement } = toHeroDoc(
        img,
        fileInfo.get(fileIdFromUrl(img.imageUrl) ?? "")
      );
      return { replaceOne: { filter: { _id }, replacement, upsert: true } };
    }),
  ]);

  const kept = new Set(images.map((img) => img.imageUrl));
  const removed = [...existing.values()]
    .filter((doc) => !kept.has(doc.imageUrl))
    .map((doc) => fileIdFromUrl(doc.imageUrl))
    .filter((id): id is string => Boolean(id));
  await cleanUpImages(removed);
  return images;
}

export async function getMenuCategories(): Promise<MenuCategory[]> {
  return (await getContent()).menuCategories;
}

export async function menuCategoryExists(id: string): Promise<boolean> {
  return Boolean(await (await db()).menuCategories.countDocuments({ _id: id }, { limit: 1 }));
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function labelTaken(c: Collections, label: string, exceptId?: string) {
  return Boolean(
    await c.menuCategories.countDocuments(
      {
        label: { $regex: `^${escapeRegex(label)}$`, $options: "i" },
        ...(exceptId ? { _id: { $ne: exceptId } } : {}),
      },
      { limit: 1 }
    )
  );
}

/** Returns null when a category with the same name already exists. */
export async function createMenuCategory(label: string): Promise<MenuCategory | null> {
  const c = await db();
  if (await labelTaken(c, label)) return null;

  const base = categoryIdFromLabel(label);
  const taken = new Set(
    (await c.menuCategories.find({}, { projection: { _id: 1 } }).toArray()).map((d) => d._id)
  );
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;

  const last = await c.menuCategories.find().sort({ position: -1 }).limit(1).next();
  const now = new Date().toISOString();
  const category: MenuCategory = {
    id,
    label,
    position: (last?.position ?? -1) + 1,
    createdAt: now,
    updatedAt: now,
  };
  const { id: _id, ...doc } = category;
  await c.menuCategories.insertOne({ _id, ...doc });
  return category;
}

/** Only the name changes; the id (stored on each item) stays the same. */
export async function renameMenuCategory(
  id: string,
  label: string
): Promise<MenuCategory | "not-found" | "taken"> {
  const c = await db();
  if (await labelTaken(c, label, id)) return "taken";
  const doc = await c.menuCategories.findOneAndUpdate(
    { _id: id },
    { $set: { label, updatedAt: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  return doc ? toMenuCategory(doc) : "not-found";
}

/** Only empty categories can be deleted, so no menu item is ever left without one. */
export async function deleteMenuCategory(id: string): Promise<"deleted" | "not-found" | "in-use"> {
  const c = await db();
  if (await c.menuItems.countDocuments({ category: id }, { limit: 1 })) return "in-use";
  const result = await c.menuCategories.deleteOne({ _id: id });
  return result.deletedCount ? "deleted" : "not-found";
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
  await c.menuItems.insertOne(toMenuDoc(item));
  return item;
}

export async function updateMenuItem(id: string, input: MenuItemInput): Promise<MenuItem | null> {
  const before = await (await db()).menuItems.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        ...input,
        imageFileId: toFileId(input.imageUrl),
        updatedAt: new Date().toISOString(),
      },
    },
    { returnDocument: "before" }
  );
  if (!before) return null;

  const oldFile = fileIdFromUrl(before.imageUrl);
  if (oldFile && before.imageUrl !== input.imageUrl) await cleanUpImages([oldFile]);
  return toMenuItem({ ...before, ...input, updatedAt: new Date().toISOString() });
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const doc = await (await db()).menuItems.findOneAndDelete({ _id: id });
  if (!doc) return false;
  const oldFile = fileIdFromUrl(doc.imageUrl);
  await cleanUpImages(oldFile ? [oldFile] : []);
  return true;
}

export async function getFavourites(): Promise<Favourite[]> {
  return (await getContent()).favourites;
}

export async function createFavourite(input: FavouriteInput): Promise<Favourite> {
  const c = await db();
  const last = await c.favourites.find().sort({ position: -1 }).limit(1).next();
  const now = new Date().toISOString();
  const favourite: Favourite = {
    ...input,
    id: randomUUID(),
    position: (last?.position ?? -1) + 1,
    createdAt: now,
    updatedAt: now,
  };
  await c.favourites.insertOne(toFavouriteDoc(favourite));
  return favourite;
}

export async function updateFavourite(
  id: string,
  input: FavouriteInput
): Promise<Favourite | null> {
  const updatedAt = new Date().toISOString();
  const before = await (await db()).favourites.findOneAndUpdate(
    { _id: id },
    { $set: { ...input, imageFileId: toFileId(input.imageUrl), updatedAt } },
    { returnDocument: "before" }
  );
  if (!before) return null;

  const oldFile = fileIdFromUrl(before.imageUrl);
  if (oldFile && before.imageUrl !== input.imageUrl) await cleanUpImages([oldFile]);
  return toFavourite({ ...before, ...input, updatedAt });
}

export async function deleteFavourite(id: string): Promise<boolean> {
  const doc = await (await db()).favourites.findOneAndDelete({ _id: id });
  if (!doc) return false;
  const oldFile = fileIdFromUrl(doc.imageUrl);
  await cleanUpImages(oldFile ? [oldFile] : []);
  return true;
}

/**
 * Sets the display order; `ids` must list every favourite exactly once.
 * Returns null when the list doesn't match what's saved (e.g. edited in another tab).
 */
export async function reorderFavourites(ids: string[]): Promise<Favourite[] | null> {
  const c = await db();
  const existing = await c.favourites.find().toArray();
  const byId = new Map(existing.map((doc) => [doc._id, doc]));
  if (ids.length !== existing.length || ids.some((id) => !byId.has(id))) return null;

  const now = new Date().toISOString();
  const changed = ids.filter((id, position) => byId.get(id)!.position !== position);
  if (changed.length) {
    await c.favourites.bulkWrite(
      changed.map((id) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { position: ids.indexOf(id), updatedAt: now } },
        },
      }))
    );
  }
  return ids.map((id, position) => {
    const doc = byId.get(id)!;
    return toFavourite(
      doc.position === position ? doc : { ...doc, position, updatedAt: now }
    );
  });
}

/** Replaces the whole Our Story gallery; array order becomes display order. */
export async function saveStoryImages(input: StoryImageInput[]): Promise<StoryImage[]> {
  const c = await db();
  const now = new Date().toISOString();
  const existing = new Map(
    (await c.storyImages.find().toArray()).map((doc) => [doc._id, doc])
  );
  const fileInfo = await getImageFileInfo(
    input.map((img) => fileIdFromUrl(img.imageUrl)).filter((id): id is string => Boolean(id))
  );

  const images: StoryImage[] = input.map((item, position) => {
    const prev = item.id ? existing.get(item.id) : undefined;
    const info = fileInfo.get(fileIdFromUrl(item.imageUrl) ?? "");
    const changed =
      !prev ||
      prev.imageUrl !== item.imageUrl ||
      prev.altText !== item.altText ||
      prev.position !== position;
    return {
      id: prev?._id ?? randomUUID(),
      imageUrl: item.imageUrl,
      altText: item.altText,
      width: info?.width ?? null,
      height: info?.height ?? null,
      position,
      createdAt: prev?.createdAt ?? now,
      updatedAt: changed ? now : prev.updatedAt,
    };
  });

  await c.storyImages.bulkWrite([
    { deleteMany: { filter: { _id: { $nin: images.map((img) => img.id) } } } },
    ...images.map((img) => {
      const { _id, ...replacement } = toStoryDoc(img);
      return { replaceOne: { filter: { _id }, replacement, upsert: true } };
    }),
  ]);

  const kept = new Set(images.map((img) => img.imageUrl));
  const removed = [...existing.values()]
    .filter((doc) => !kept.has(doc.imageUrl))
    .map((doc) => fileIdFromUrl(doc.imageUrl))
    .filter((id): id is string => Boolean(id));
  await cleanUpImages(removed);
  return images;
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

/** GridFS file ids currently referenced by any saved content. */
export async function getReferencedImageIds(): Promise<Set<string>> {
  const c = await db();
  const lists = await Promise.all([
    c.heroImages.distinct("imageUrl"),
    c.menuItems.distinct("imageUrl"),
    c.favourites.distinct("imageUrl"),
    c.storyImages.distinct("imageUrl"),
  ]);
  return new Set(
    lists.flat().map(fileIdFromUrl).filter((id): id is string => Boolean(id))
  );
}
