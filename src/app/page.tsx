import Navbar from "@/components/Navbar";
import HeroGallery from "@/components/HeroGallery";
import IntroSection from "@/components/IntroSection";
import TopSellers from "@/components/TopSellers";
import MenuPreview from "@/components/MenuPreview";
import StorySection from "@/components/StorySection";
import VisitSection from "@/components/VisitSection";
import Footer from "@/components/Footer";
import { HERO_IMAGE_LIMIT } from "@/lib/content/schema";
import { getContent } from "@/lib/content/store";

export default async function Home() {
  const { settings, heroImages, menuItems, favourites, storyImages } = await getContent();

  const hero = heroImages
    .filter((img) => img.isActive)
    .slice(0, HERO_IMAGE_LIMIT)
    .map(({ id, imageUrl, altText }) => ({ id, imageUrl, altText }));

  const visibleItems = menuItems
    .filter((item) => item.isVisible)
    .map(({ id, name, description, price, category }) => ({
      id,
      name,
      description,
      price,
      category,
    }));

  // Only what the cards show: no prices in this section.
  const favouriteCards = favourites.map(({ id, name, description, imageUrl }) => ({
    id,
    name,
    description,
    imageUrl,
  }));

  const story = storyImages.map(({ id, imageUrl, altText, width, height }) => ({
    id,
    imageUrl,
    altText,
    width,
    height,
  }));

  return (
    <main className="grain relative overflow-x-clip">
      <Navbar instagramUrl={settings.instagramUrl} />
      <HeroGallery images={hero} />
      <IntroSection />
      <TopSellers items={favouriteCards} />
      <MenuPreview items={visibleItems} />
      <StorySection images={story} />
      <VisitSection settings={settings} />
      <Footer />
    </main>
  );
}
