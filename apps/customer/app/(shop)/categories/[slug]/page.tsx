import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/products?category=${slug}`);
}
