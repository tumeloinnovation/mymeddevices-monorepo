import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CategoryDetailPage from "./_components/CategoryDetailPage";
import { SEED_CATEGORIES } from "@/lib/data/seed/categories";

const SITE_URL = 'https://mymeddevices.com'

type Props = {
  params: Promise<{ slug: string }>
}

// Keep generateStaticParams for static generation
export async function generateStaticParams() {
  return SEED_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = SEED_CATEGORIES.find((c) => c.slug === slug)

  if (!category) {
    return { title: 'Category Not Found', description: 'The requested category could not be found.' }
  }

  const cleanDescription = category.description?.replace(/<[^>]*>/g, '')
    || `Browse ${category.name} medical devices and equipment at MyMedDevices - Kenya's trusted healthcare store.`

  const categoryImage = category.image?.src || '/logos/logo.png'
  const categoryUrl = `${SITE_URL}/categories/${slug}`

  return {
    title: `${category.name} - Medical Devices`,
    description: cleanDescription.slice(0, 160),
    alternates: { canonical: categoryUrl },
    openGraph: {
      title: `${category.name} - Medical Devices`,
      description: cleanDescription.slice(0, 160),
      url: categoryUrl,
      siteName: 'MyMedDevices',
      images: [{ url: categoryImage, width: 800, height: 600, alt: category.name }],
      type: 'website',
      locale: 'en_KE',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} - Medical Devices`,
      description: cleanDescription.slice(0, 160),
      images: [categoryImage],
    },
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = SEED_CATEGORIES.find((c) => c.slug === slug);

  if (!category) notFound();

  return <CategoryDetailPage slug={slug} />;
}
