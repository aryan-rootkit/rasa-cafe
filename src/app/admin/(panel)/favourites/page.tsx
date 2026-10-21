import FavouritesManager from "@/components/admin/FavouritesManager";
import { getFavourites } from "@/lib/content/store";

export default async function AdminFavouritesPage() {
  const favourites = await getFavourites();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Manage RASA Favourites</h1>
      <p className="mt-1 text-sm text-stone-500">
        The photo, name and description shown in “The RASA favourites” on the homepage.
        Add as many as you like and arrange them in the order they should appear.
      </p>
      <FavouritesManager initial={favourites} />
    </div>
  );
}
