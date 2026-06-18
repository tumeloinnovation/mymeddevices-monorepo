import { SEED_CATEGORIES } from "@/lib/data/seed/categories";
import CategoriesPage from "../_components/CategoriesPage";

export const metadata = {
  title: 'Shop By Categories | MyMedDevices',
  description: 'Browse all medical device categories — blood pressure monitors, wheelchairs, nebulizers, diagnostic equipment and more.',
};

export default function Page() {
  return <CategoriesPage />;
}