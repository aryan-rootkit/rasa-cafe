import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createDefaultContent } from "./defaults";
import {
  HERO_IMAGE_LIMIT,
  type AdminUser,
  type ContentDatabase,
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
 * File-backed content store. Every read/write goes through this module, so
 * swapping it for a real database only means reimplementing these functions.
 */

export const STORAGE_DIR = path.resolve(
  /*turbopackIgnore: true*/ process.env.STORAGE_DIR ?? path.join(process.cwd(), "storage")
);
const DB_FILE = path.join(STORAGE_DIR, "content.json");

let writeQueue: Promise<unknown> = Promise.resolve();

async function readDb(): Promise<ContentDatabase> {
  try {
    const raw = await readFile(DB_FILE, "utf8");
    return JSON.parse(raw) as ContentDatabase;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return createDefaultContent();
    }
    throw error;
  }
}

async function writeDb(db: ContentDatabase) {
  await mkdir(STORAGE_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await rename(tmp, DB_FILE);
}

/** Serialises read-modify-write cycles so concurrent saves can't clobber each other. */
function mutate<T>(fn: (db: ContentDatabase) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const db = await readDb();
    const result = await fn(db);
    await writeDb(db);
    return result;
  });
  writeQueue = run.catch(() => undefined);
  return run;
}

const byPosition = <T extends { position: number }>(a: T, b: T) =>
  a.position - b.position;

export async function getContent(): Promise<SiteContent> {
  const content: SiteContent = await readDb();
  delete (content as ContentDatabase).adminUsers;
  content.heroImages.sort(byPosition);
  content.menuItems.sort(byPosition);
  return content;
}

export async function getSettings(): Promise<WebsiteSettings> {
  return (await readDb()).settings;
}

export async function updateSettings(
  input: SettingsInput
): Promise<WebsiteSettings> {
  return mutate((db) => {
    db.settings = { ...input, updatedAt: new Date().toISOString() };
    return db.settings;
  });
}

export async function getPublicHeroImages(): Promise<HeroImage[]> {
  const { heroImages } = await getContent();
  return heroImages.filter((img) => img.isActive).slice(0, HERO_IMAGE_LIMIT);
}

/** Replaces the whole hero list; array order becomes display order. */
export async function saveHeroImages(
  input: HeroImageInput[]
): Promise<HeroImage[]> {
  return mutate((db) => {
    const now = new Date().toISOString();
    const existing = new Map(db.heroImages.map((img) => [img.id, img]));

    db.heroImages = input.slice(0, HERO_IMAGE_LIMIT).map((item, position) => {
      const prev = item.id ? existing.get(item.id) : undefined;
      const changed =
        !prev ||
        prev.imageUrl !== item.imageUrl ||
        prev.altText !== item.altText ||
        prev.isActive !== item.isActive ||
        prev.position !== position;
      return {
        id: prev?.id ?? randomUUID(),
        imageUrl: item.imageUrl,
        altText: item.altText,
        isActive: item.isActive,
        position,
        createdAt: prev?.createdAt ?? now,
        updatedAt: changed ? now : prev.updatedAt,
      };
    });
    return db.heroImages;
  });
}

export async function getMenuItems(): Promise<MenuItem[]> {
  return (await getContent()).menuItems;
}

export async function getVisibleMenuItems(): Promise<MenuItem[]> {
  return (await getMenuItems()).filter((item) => item.isVisible);
}

export async function createMenuItem(input: MenuItemInput): Promise<MenuItem> {
  return mutate((db) => {
    const now = new Date().toISOString();
    const item: MenuItem = {
      ...input,
      id: randomUUID(),
      position: Math.max(-1, ...db.menuItems.map((m) => m.position)) + 1,
      createdAt: now,
      updatedAt: now,
    };
    db.menuItems.push(item);
    return item;
  });
}

export async function updateMenuItem(
  id: string,
  input: MenuItemInput
): Promise<MenuItem | null> {
  return mutate((db) => {
    const item = db.menuItems.find((m) => m.id === id);
    if (!item) return null;
    Object.assign(item, input, { updatedAt: new Date().toISOString() });
    return item;
  });
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  return mutate((db) => {
    const before = db.menuItems.length;
    db.menuItems = db.menuItems.filter((m) => m.id !== id);
    return db.menuItems.length < before;
  });
}

export async function findAdminUserByUsername(
  username: string
): Promise<AdminUser | null> {
  const users = (await readDb()).adminUsers ?? [];
  return users.find((u) => u.username === username.toLowerCase()) ?? null;
}

export async function findAdminUserById(id: string): Promise<AdminUser | null> {
  const users = (await readDb()).adminUsers ?? [];
  return users.find((u) => u.id === id) ?? null;
}

export async function listAdminUsers(): Promise<PublicAdminUser[]> {
  const users = (await readDb()).adminUsers ?? [];
  return users.map(({ id, username, createdAt }) => ({ id, username, createdAt }));
}

/** Returns null when the username is already taken. */
export async function createAdminUser(
  username: string,
  passwordHash: string
): Promise<AdminUser | null> {
  return mutate((db) => {
    db.adminUsers ??= [];
    if (db.adminUsers.some((u) => u.username === username)) return null;
    const user: AdminUser = {
      id: randomUUID(),
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    db.adminUsers.push(user);
    return user;
  });
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  return mutate((db) => {
    const before = db.adminUsers?.length ?? 0;
    db.adminUsers = (db.adminUsers ?? []).filter((u) => u.id !== id);
    return db.adminUsers.length < before;
  });
}

/** Every uploaded media URL currently referenced by saved content. */
export async function getReferencedMedia(): Promise<Set<string>> {
  const db = await readDb();
  return new Set(
    [...db.heroImages.map((i) => i.imageUrl), ...db.menuItems.map((m) => m.imageUrl)]
      .filter((url) => url.startsWith("/media/"))
  );
}
