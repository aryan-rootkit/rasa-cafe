/** Brand copy. Contact details, hero images and the menu live in the admin-managed content store. */
export const brand = {
  name: "RASA",
  tagline: "Food. Coffee. Moments.",
  heroLine:
    "Made for slow mornings, quick conversations and everything in between.",
  description:
    "RASA is a café built around good food, thoughtful coffee and the simple pleasure of spending time together.",
};

/** RASA's official Google Maps listing, opened by the "Get Directions" buttons. */
export const directionsUrl = "https://share.google/0cMIZgnrtY0MILf4u";

export const formatPrice = (price: number) => `₹${price}`;

export const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "Menu", href: "/#menu" },
  { label: "Our Story", href: "/#story" },
  { label: "Visit", href: "/#visit" },
] as const;
