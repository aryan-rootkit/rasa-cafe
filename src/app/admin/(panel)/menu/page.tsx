import MenuManager from "@/components/admin/MenuManager";
import { getContent } from "@/lib/content/store";

export default async function AdminMenuPage() {
  const { menuCategories, menuItems } = await getContent();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Menu</h1>
      <p className="mt-1 text-sm text-stone-500">
        Pick a category to see its items, or add a new one. Prices are shown for
        information only. The homepage favourites are managed under RASA Favourites.
      </p>
      <MenuManager initialCategories={menuCategories} initialItems={menuItems} />
    </div>
  );
}
