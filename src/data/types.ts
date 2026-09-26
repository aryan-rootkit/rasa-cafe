export type Currency = "INR";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: MenuCategoryId;
  featured?: boolean;
  available?: boolean;
}

export type MenuCategoryId =
  | "coffee"
  | "breakfast"
  | "small-plates"
  | "mains"
  | "desserts"
  | "beverages";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  available?: boolean;
}

export interface MenuCategory {
  id: MenuCategoryId;
  label: string;
  items: MenuItem[];
}

export interface HeroSlide {
  id: string;
  label: string;
  image: string;
}

export interface OrderOfTheDay {
  id: string;
  eyebrow: string;
  name: string;
  notes: string[];
  price: number;
  image: string;
  dateLabel?: string;
}

export interface SiteInfo {
  name: string;
  tagline: string;
  description: string;
  address: {
    line1: string;
    line2: string;
    city: string;
  };
  hours: {
    days: string;
    time: string;
  };
  phone: string;
  email: string;
  instagram: string;
  mapsUrl: string;
}
