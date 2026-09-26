import type {
  HeroSlide,
  MenuCategory,
  OrderOfTheDay,
  Product,
  SiteInfo,
} from "./types";

export const siteInfo: SiteInfo = {
  name: "RASA",
  tagline: "Food. Coffee. Moments.",
  description:
    "RASA is a café built around good food, thoughtful coffee and the simple pleasure of spending time together.",
  address: {
    line1: "42, Lavelle Road",
    line2: "Near UB City",
    city: "Bengaluru 560001",
  },
  hours: {
    days: "MON — SUN",
    time: "8:00 AM — 11:00 PM",
  },
  phone: "+91 80 4123 5678",
  email: "hello@rasacafe.in",
  instagram: "https://instagram.com/rasacafe",
  mapsUrl: "https://maps.google.com/?q=Lavelle+Road+Bengaluru",
};

export const heroSlides: HeroSlide[] = [
  {
    id: "coffee",
    label: "Coffee",
    image: "/images/hero/coffee.jpg",
  },
  {
    id: "croissant",
    label: "Croissant",
    image: "/images/hero/croissant.jpg",
  },
  {
    id: "pasta",
    label: "Pasta",
    image: "/images/hero/pasta.jpg",
  },
  {
    id: "sandwich",
    label: "Sandwich",
    image: "/images/hero/sandwich.jpg",
  },
  {
    id: "cake",
    label: "Cake",
    image: "/images/hero/cake.jpg",
  },
  {
    id: "cold-coffee",
    label: "Cold Coffee",
    image: "/images/hero/cold-coffee.jpg",
  },
  {
    id: "pizza",
    label: "Pizza",
    image: "/images/hero/pizza.jpg",
  },
  {
    id: "dessert",
    label: "Dessert",
    image: "/images/hero/dessert.jpg",
  },
];

export const topSellers: Product[] = [
  {
    id: "cappuccino",
    name: "Cappuccino",
    description: "Double espresso, steamed milk, soft foam",
    price: 180,
    image: "/images/products/cappuccino.jpg",
    category: "coffee",
    featured: true,
  },
  {
    id: "butter-croissant",
    name: "Butter Croissant",
    description: "Flaky, golden, baked fresh",
    price: 160,
    image: "/images/products/croissant.jpg",
    category: "breakfast",
    featured: true,
  },
  {
    id: "mushroom-pasta",
    name: "Creamy Mushroom Pasta",
    description: "Mushroom, parmesan, herbs",
    price: 340,
    image: "/images/products/pasta.jpg",
    category: "mains",
    featured: true,
  },
  {
    id: "tiramisu",
    name: "Tiramisu",
    description: "Espresso, mascarpone, cocoa",
    price: 280,
    image: "/images/products/tiramisu.jpg",
    category: "desserts",
    featured: true,
  },
  {
    id: "avocado-toast",
    name: "Avocado Toast",
    description: "Sourdough, chilli flakes, lemon",
    price: 260,
    image: "/images/products/avocado-toast.jpg",
    category: "breakfast",
    featured: true,
  },
  {
    id: "flat-white",
    name: "Flat White",
    description: "Velvety milk, rich espresso",
    price: 190,
    image: "/images/products/latte.jpg",
    category: "coffee",
    featured: true,
  },
];

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

export const menuCategories: MenuCategory[] = [
  {
    id: "coffee",
    label: "Coffee",
    items: [
      { id: "espresso", name: "Espresso", price: 120 },
      { id: "americano", name: "Americano", price: 150 },
      { id: "cappuccino", name: "Cappuccino", price: 180 },
      { id: "latte", name: "Latte", price: 190 },
      { id: "mocha", name: "Mocha", price: 210 },
    ],
  },
  {
    id: "breakfast",
    label: "Breakfast",
    items: [
      { id: "croissant", name: "Butter Croissant", price: 160 },
      { id: "avocado-toast", name: "Avocado Toast", price: 260 },
      { id: "shakshuka", name: "Shakshuka", price: 320 },
      { id: "granola-bowl", name: "Granola Bowl", price: 240 },
    ],
  },
  {
    id: "small-plates",
    label: "Small Plates",
    items: [
      { id: "bruschetta", name: "Tomato Bruschetta", price: 220 },
      { id: "fries", name: "Truffle Fries", price: 280 },
      { id: "hummus", name: "Hummus & Flatbread", price: 250 },
    ],
  },
  {
    id: "mains",
    label: "Mains",
    items: [
      { id: "mushroom-pasta", name: "Creamy Mushroom Pasta", price: 340 },
      { id: "club-sandwich", name: "RASA Club Sandwich", price: 310 },
      { id: "margherita", name: "Margherita Pizza", price: 380 },
      { id: "grain-bowl", name: "Seasonal Grain Bowl", price: 360 },
    ],
  },
  {
    id: "desserts",
    label: "Desserts",
    items: [
      { id: "tiramisu", name: "Tiramisu", price: 280 },
      { id: "chocolate-cake", name: "Chocolate Cake", price: 260 },
      { id: "cheesecake", name: "Basque Cheesecake", price: 290 },
    ],
  },
  {
    id: "beverages",
    label: "Beverages",
    items: [
      { id: "cold-brew", name: "Cold Brew", price: 200 },
      { id: "matcha", name: "Iced Matcha", price: 230 },
      { id: "fresh-lime", name: "Fresh Lime Soda", price: 140 },
      { id: "hot-chocolate", name: "Hot Chocolate", price: 210 },
    ],
  },
];

export const formatPrice = (price: number) => `₹${price}`;

export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Menu", href: "#menu" },
  { label: "Our Story", href: "#story" },
  { label: "Visit", href: "#visit" },
] as const;
