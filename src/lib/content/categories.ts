export const MENU_CATEGORIES = [
  { id: "coffee", label: "Coffee" },
  { id: "breakfast", label: "Breakfast" },
  { id: "small-plates", label: "Small Plates" },
  { id: "mains", label: "Mains" },
  { id: "desserts", label: "Desserts" },
  { id: "beverages", label: "Beverages" },
] as const;

export type MenuCategoryId = (typeof MENU_CATEGORIES)[number]["id"];
