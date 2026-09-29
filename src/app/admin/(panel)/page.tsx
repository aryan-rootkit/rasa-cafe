import Link from "next/link";
import { ArrowRight, Images, Settings, UtensilsCrossed } from "lucide-react";
import { getContent } from "@/lib/content/store";
import { HERO_IMAGE_LIMIT } from "@/lib/content/schema";

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export default async function AdminDashboardPage() {
  const { settings, heroImages, menuItems } = await getContent();
  const activeHero = heroImages.filter((i) => i.isActive).length;
  const visibleItems = menuItems.filter((i) => i.isVisible).length;

  const cards = [
    {
      href: "/admin/settings",
      icon: Settings,
      title: "Website Settings",
      stat: settings.email,
      detail: `Last updated ${dateFormat.format(new Date(settings.updatedAt))}`,
    },
    {
      href: "/admin/images",
      icon: Images,
      title: "Hero Images",
      stat: `${activeHero} / ${HERO_IMAGE_LIMIT} showing`,
      detail:
        activeHero < HERO_IMAGE_LIMIT
          ? `Add ${HERO_IMAGE_LIMIT - activeHero} more for the full gallery`
          : "Gallery is complete",
    },
    {
      href: "/admin/menu",
      icon: UtensilsCrossed,
      title: "Menu",
      stat: `${visibleItems} visible items`,
      detail: `${menuItems.length - visibleItems} hidden · ${
        menuItems.filter((i) => i.isFeatured && i.isVisible).length
      } favourites`,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-stone-500">
        Changes you save here appear on the public website right away.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map(({ href, icon: Icon, title, stat, detail }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-stone-200 bg-white p-5 transition-colors hover:border-stone-400"
          >
            <div className="flex items-center justify-between text-stone-500">
              <Icon size={20} />
              <ArrowRight
                size={16}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              />
            </div>
            <p className="mt-4 text-sm font-medium text-stone-500">{title}</p>
            <p className="mt-1 truncate text-lg font-semibold">{stat}</p>
            <p className="mt-1 text-sm text-stone-500">{detail}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
