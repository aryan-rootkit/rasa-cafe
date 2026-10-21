/** The categories a new database starts with; admins can add and rename them. */
export const DEFAULT_MENU_CATEGORIES = [
  { id: "coffee", label: "Coffee" },
  { id: "breakfast", label: "Breakfast" },
  { id: "small-plates", label: "Small Plates" },
  { id: "mains", label: "Mains" },
  { id: "desserts", label: "Desserts" },
  { id: "beverages", label: "Beverages" },
] as const;

export type MenuCategoryId = string;

/** URL-safe id for a new category, e.g. "Small Plates" → "small-plates". */
export function categoryIdFromLabel(label: string): string {
  return (
    label
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "category"
  );
}
