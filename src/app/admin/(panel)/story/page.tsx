import StoryGalleryManager from "@/components/admin/StoryGalleryManager";
import { getContent } from "@/lib/content/store";

export default async function AdminStoryGalleryPage() {
  const { storyImages } = await getContent();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Manage Our Story Gallery</h1>
      <p className="mt-1 text-sm text-stone-500">
        The café photos that scroll across the Our Story section: the space, the people,
        the coffee and the food. Drag to reorder, then save to publish.
      </p>
      <StoryGalleryManager initial={storyImages} />
    </div>
  );
}
