import MenuManager from "@/components/admin/MenuManager";
import { getMenuItems } from "@/lib/content/store";

export default async function AdminMenuPage() {
  const items = await getMenuItems();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Menu</h1>
      <p className="mt-1 text-sm text-stone-500">
        Prices are shown for information only. Mark items as a favourite (with a
        photo) to feature them in “The RASA favourites”.
      </p>
      <MenuManager initial={items} />
    </div>
  );
}
