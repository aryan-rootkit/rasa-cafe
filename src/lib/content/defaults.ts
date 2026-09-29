import type {
  ContentDatabase,
  HeroImage,
  MenuCategoryId,
  MenuItem,
} from "./schema";

const SEED_DATE = "2026-09-29T00:00:00.000Z";

const heroSeed: Array<[string, string]> = [
  ["/images/hero/01.jpg", "Latte art in a ceramic cup held in both hands"],
  ["/images/hero/02.jpg", "Golden butter croissants fresh from the oven"],
  ["/images/hero/03.jpg", "Warm pendant lights above the café counter"],
  ["/images/hero/04.jpg", "A bowl of pasta finished with herbs"],
  ["/images/hero/05.jpg", "A stacked café sandwich on a wooden board"],
  ["/images/hero/06.jpg", "Iced coffee with milk swirling through it"],
  ["/images/hero/07.jpg", "Three flat whites on a wooden table among plants"],
  ["/images/hero/08.jpg", "A slice of layered celebration cake"],
  ["/images/hero/09.jpg", "Wood-fired pizza with basil and mozzarella"],
  ["/images/hero/10.jpg", "A glass of layered berry dessert"],
];

const heroImages: HeroImage[] = heroSeed.map(([imageUrl, altText], i) => ({
  id: `00000000-0000-4000-8000-0000000000${String(i + 1).padStart(2, "0")}`,
  imageUrl,
  altText,
  position: i,
  isActive: true,
  createdAt: SEED_DATE,
  updatedAt: SEED_DATE,
}));

type MenuSeed = {
  name: string;
  category: MenuCategoryId;
  price: number;
  description?: string;
  imageUrl?: string;
  isFeatured?: boolean;
};

const menuSeed: MenuSeed[] = [
  { name: "Espresso", category: "coffee", price: 120 },
  { name: "Americano", category: "coffee", price: 150 },
  {
    name: "Cappuccino",
    category: "coffee",
    price: 180,
    description: "Double espresso, steamed milk, soft foam",
    imageUrl: "/images/products/cappuccino.jpg",
    isFeatured: true,
  },
  {
    name: "Flat White",
    category: "coffee",
    price: 190,
    description: "Velvety milk, rich espresso",
    imageUrl: "/images/products/latte.jpg",
    isFeatured: true,
  },
  { name: "Latte", category: "coffee", price: 190 },
  { name: "Mocha", category: "coffee", price: 210 },
  {
    name: "Butter Croissant",
    category: "breakfast",
    price: 160,
    description: "Flaky, golden, baked fresh",
    imageUrl: "/images/products/croissant.jpg",
    isFeatured: true,
  },
  {
    name: "Avocado Toast",
    category: "breakfast",
    price: 260,
    description: "Sourdough, chilli flakes, lemon",
    imageUrl: "/images/products/avocado-toast.jpg",
    isFeatured: true,
  },
  { name: "Shakshuka", category: "breakfast", price: 320 },
  { name: "Granola Bowl", category: "breakfast", price: 240 },
  { name: "Tomato Bruschetta", category: "small-plates", price: 220 },
  { name: "Truffle Fries", category: "small-plates", price: 280 },
  { name: "Hummus & Flatbread", category: "small-plates", price: 250 },
  {
    name: "Creamy Mushroom Pasta",
    category: "mains",
    price: 340,
    description: "Mushroom, parmesan, herbs",
    imageUrl: "/images/products/pasta.jpg",
    isFeatured: true,
  },
  { name: "RASA Club Sandwich", category: "mains", price: 310 },
  { name: "Margherita Pizza", category: "mains", price: 380 },
  { name: "Seasonal Grain Bowl", category: "mains", price: 360 },
  {
    name: "Tiramisu",
    category: "desserts",
    price: 280,
    description: "Espresso, mascarpone, cocoa",
    imageUrl: "/images/products/tiramisu.jpg",
    isFeatured: true,
  },
  { name: "Chocolate Cake", category: "desserts", price: 260 },
  { name: "Basque Cheesecake", category: "desserts", price: 290 },
  { name: "Cold Brew", category: "beverages", price: 200 },
  { name: "Iced Matcha", category: "beverages", price: 230 },
  { name: "Fresh Lime Soda", category: "beverages", price: 140 },
  { name: "Hot Chocolate", category: "beverages", price: 210 },
];

const menuItems: MenuItem[] = menuSeed.map((item, i) => ({
  id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
  name: item.name,
  description: item.description ?? "",
  category: item.category,
  price: item.price,
  imageUrl: item.imageUrl ?? "",
  isVisible: true,
  isFeatured: item.isFeatured ?? false,
  position: i,
  createdAt: SEED_DATE,
  updatedAt: SEED_DATE,
}));

export function createDefaultContent(): ContentDatabase {
  return structuredClone({
    version: 1,
    settings: {
      instagramUrl: "https://www.instagram.com/rasa.pune",
      mapsUrl: "https://share.google/0cMIZgnrtY0MILf4u",
      email: "connect@rasacafe.in",
      phone1: "9890999285",
      phone2: "7755990957",
      address: "Shop No. 32, Destination Center, Magarpatta, Pune.",
      openingDays: "MON — SUN",
      openingHours: "8:00 AM — 11:00 PM",
      updatedAt: SEED_DATE,
    },
    heroImages,
    menuItems,
  });
}
