import HeroManager from "@/components/admin/HeroManager";
import { getContent } from "@/lib/content/store";

export default async function AdminHeroPage() {
  const { heroImages } = await getContent();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Hero Images</h1>
      <p className="mt-1 text-sm text-stone-500">
        The moving gallery at the top of the homepage is designed for exactly 10
        images. Drag to reorder, then save.
      </p>
      <HeroManager initial={heroImages} />
    </div>
  );
}
