import Navbar from "@/components/Navbar";
import HeroGallery from "@/components/HeroGallery";
import IntroSection from "@/components/IntroSection";
import TopSellers from "@/components/TopSellers";
import OrderOfTheDay from "@/components/OrderOfTheDay";
import MenuPreview from "@/components/MenuPreview";
import StorySection from "@/components/StorySection";
import VisitSection from "@/components/VisitSection";
import Footer from "@/components/Footer";
import { HERO_IMAGE_LIMIT } from "@/lib/content/schema";
import { getContent } from "@/lib/content/store";

export default async function Home() {
  const { settings, heroImages, menuItems } = await getContent();

  const hero = heroImages
    .filter((img) => img.isActive)
    .slice(0, HERO_IMAGE_LIMIT)
    .map(({ id, imageUrl, altText }) => ({ id, imageUrl, altText }));

  const visibleItems = menuItems
    .filter((item) => item.isVisible)
    .map(({ id, name, description, price, category, imageUrl, isFeatured }) => ({
      id,
      name,
      description,
      price,
      category,
      imageUrl,
      isFeatured,
    }));

  const favourites = visibleItems.filter((item) => item.isFeatured && item.imageUrl);

  return (
    <main className="grain relative overflow-x-clip">
      <Navbar mapsUrl={settings.mapsUrl} instagramUrl={settings.instagramUrl} />
      <HeroGallery images={hero} />
      <IntroSection />
      <TopSellers items={favourites} />
      <OrderOfTheDay />
      <MenuPreview items={visibleItems} />
      <StorySection />
      <VisitSection settings={settings} />
      <Footer settings={settings} />
    </main>
  );
}
