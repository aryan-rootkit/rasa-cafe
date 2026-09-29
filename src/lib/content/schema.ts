import { z } from "zod";
import { MENU_CATEGORIES, type MenuCategoryId } from "./categories";

export { MENU_CATEGORIES, type MenuCategoryId };

export const HERO_IMAGE_LIMIT = 10;

const categoryIds = MENU_CATEGORIES.map((c) => c.id) as [
  MenuCategoryId,
  ...MenuCategoryId[],
];

// Only images we host ourselves: bundled seed images or processed uploads.
const LOCAL_IMAGE_PATTERN =
  /^\/(?:images\/[a-z0-9/_-]+\.(?:jpe?g|png|webp)|media\/[a-f0-9-]{36}\.webp)$/i;

export const imageUrlSchema = z
  .string()
  .trim()
  .regex(LOCAL_IMAGE_PATTERN, "Upload an image to use here.")
  .refine((v) => !v.includes(".."), "Invalid image path.");

const httpsUrl = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(500)
    .url(`${label} must be a valid URL.`)
    .refine((v) => v.startsWith("https://"), `${label} must start with https://`);

const phone = (label: string, required: boolean) => {
  const base = z
    .string()
    .trim()
    .max(20)
    .regex(/^\+?[0-9\s-]*$/, `${label} can only contain digits, spaces, + and -.`);
  return required
    ? base.refine(
        (v) => v.replace(/\D/g, "").length >= 7,
        `${label} must have at least 7 digits.`
      )
    : base.refine(
        (v) => v === "" || v.replace(/\D/g, "").length >= 7,
        `${label} must have at least 7 digits.`
      );
};

export const settingsInputSchema = z.object({
  instagramUrl: httpsUrl("Instagram URL"),
  mapsUrl: httpsUrl("Google Maps URL"),
  email: z.string().trim().max(200).email("Enter a valid email address."),
  phone1: phone("Phone 1", true),
  phone2: phone("Phone 2", false),
  address: z.string().trim().min(5, "Address is too short.").max(300),
  openingDays: z.string().trim().max(60),
  openingHours: z.string().trim().max(60),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
export type WebsiteSettings = SettingsInput & { updatedAt: string };

export const heroImageInputSchema = z.object({
  id: z.string().uuid().optional(),
  imageUrl: imageUrlSchema,
  altText: z
    .string()
    .trim()
    .min(3, "Alt text should describe the image (min 3 characters).")
    .max(160),
  isActive: z.boolean(),
});

export const heroImagesInputSchema = z
  .array(heroImageInputSchema)
  .max(HERO_IMAGE_LIMIT, `You can have at most ${HERO_IMAGE_LIMIT} hero images.`);

export type HeroImageInput = z.infer<typeof heroImageInputSchema>;

export type HeroImage = {
  id: string;
  imageUrl: string;
  altText: string;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const menuItemInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(80),
  description: z.string().trim().max(200),
  category: z.enum(categoryIds, { message: "Choose a category." }),
  price: z
    .number({ message: "Price must be a number." })
    .int("Use a whole number.")
    .min(0, "Price can't be negative.")
    .max(100000),
  imageUrl: z.union([imageUrlSchema, z.literal("")]),
  isVisible: z.boolean(),
  isFeatured: z.boolean(),
});

export type MenuItemInput = z.infer<typeof menuItemInputSchema>;

export type MenuItem = MenuItemInput & {
  id: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export const signupInputSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username can be at most 32 characters.")
    .regex(
      /^[a-z0-9._-]+$/,
      "Use lowercase letters, numbers, dots, dashes or underscores."
    ),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .max(200, "Password is too long."),
});

export type SignupInput = z.infer<typeof signupInputSchema>;

export type AdminUser = {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
};

export type PublicAdminUser = Pick<AdminUser, "id" | "username" | "createdAt">;

export type ContentDatabase = {
  version: 1;
  settings: WebsiteSettings;
  heroImages: HeroImage[];
  menuItems: MenuItem[];
  adminUsers?: AdminUser[];
};

/** Everything the site renders; admin accounts are never included. */
export type SiteContent = Omit<ContentDatabase, "adminUsers">;

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}
