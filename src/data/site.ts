import type { OrderOfTheDay } from "./types";

/** Brand copy. Contact details, hero images and the menu live in the admin-managed content store. */
export const brand = {
  name: "RASA",
  tagline: "Food. Coffee. Moments.",
  heroLine:
    "Made for slow mornings, quick conversations and everything in between.",
  description:
    "RASA is a café built around good food, thoughtful coffee and the simple pleasure of spending time together.",
};

/** Featured special — swap this object to change Order of the Day */
export const orderOfTheDay: OrderOfTheDay = {
  id: "rasa-special-latte",
  eyebrow: "Order of the day",
  name: "RASA Special Latte",
  notes: ["Espresso", "Vanilla", "Cinnamon", "Cold Foam"],
  price: 220,
  image: "/images/products/special-latte.jpg",
  dateLabel: "Today",
};

export const formatPrice = (price: number) => `₹${price}`;

export const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "Menu", href: "/#menu" },
  { label: "Our Story", href: "/#story" },
  { label: "Visit", href: "/#visit" },
] as const;
