import Navbar from "@/components/Navbar";
import HeroGallery from "@/components/HeroGallery";
import IntroSection from "@/components/IntroSection";
import TopSellers from "@/components/TopSellers";
import OrderOfTheDay from "@/components/OrderOfTheDay";
import MenuPreview from "@/components/MenuPreview";
import StorySection from "@/components/StorySection";
import VisitSection from "@/components/VisitSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="grain relative overflow-x-hidden">
      <Navbar />
      <HeroGallery />
      <IntroSection />
      <TopSellers />
      <OrderOfTheDay />
      <MenuPreview />
      <StorySection />
      <VisitSection />
      <Footer />
    </main>
  );
}
