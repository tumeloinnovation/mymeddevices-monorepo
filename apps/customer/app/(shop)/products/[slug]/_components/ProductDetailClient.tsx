'use client'

import { useState, useEffect } from 'react'
import type { Product, Review } from '@/lib/data/types'
import { useRecentlyViewedStore } from '@/lib/store/useRecentlyViewedStore'

import DescriptionTab from '@/app/(shop)/products/_components/DescriptionTab'
import ProductGallery from '@/app/(shop)/products/_components/ProductGallery'
import ProductSection from '@/components/common/ProductSection'
import ProductInfo from '@/app/(shop)/products/_components/ProductInfo'
import ReviewsTab from '@/app/(shop)/products/[slug]/_components/ReviewsTab'
import SpecsTab from '@/app/(shop)/products/_components/SpecsTab'
import BundleConfigurator from '@/app/(shop)/products/[slug]/_components/BundleConfigurator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { FileText, MessageSquare, Sliders, Package } from 'lucide-react'
import ProductNotFound from '../../_components/ProductNotFound'
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo'

const SITE_URL = 'https://mymeddevices.com'

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
  reviews: Review[];
}

export default function ProductDetailClient({ product, relatedProducts, reviews }: ProductDetailClientProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addProduct)
  const recentlyViewedItems = useRecentlyViewedStore((s) => s.items).filter(
    (p) => p.id !== product?.id && p.slug !== product?.slug
  )

  useEffect(() => {
    if (product) {
      addRecentlyViewed(product)
    }
  }, [product, addRecentlyViewed])

  if (!product) return <ProductNotFound />

  const images = (product.images || []).map((i) => i.src)
  const productUrl = `${SITE_URL}/products/${product.slug}`

  const breadcrumbItems = [
    { name: 'Home', url: SITE_URL },
    { name: 'Products', url: `${SITE_URL}/products` },
    ...(product.categories?.[0] ? [{
      name: product.categories[0].name,
      url: `${SITE_URL}/categories/${product.categories[0].slug}`
    }] : []),
    { name: product.name, url: productUrl }
  ]

  return (
    <>
      <ProductJsonLd product={product} url={productUrl} />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <div className="container mx-auto px-4 py-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="lg:sticky lg:top-8">
            <ProductGallery images={images} selected={selectedImage} onSelect={setSelectedImage} />
          </div>

          <div className="space-y-6">
            <ProductInfo product={product} quantity={quantity} setQuantity={setQuantity} />
            {/* Bundle items — rendered here for spatial proximity to the CTA */}
            <BundleConfigurator product={product} relatedProducts={relatedProducts} />
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-8">
          <div className="bg-white dark:bg-card border dark:border-border rounded-lg shadow-sm transition-colors duration-300">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="px-4 py-3 border-b dark:border-border bg-gray-50 dark:bg-muted/30 rounded-t-lg flex gap-2">
                <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:text-primary dark:data-[state=active]:text-primary transition-colors">
                  <FileText className="h-4 w-4" /> Description
                </TabsTrigger>
                <TabsTrigger value="specs" className="flex items-center gap-2 data-[state=active]:text-primary dark:data-[state=active]:text-primary transition-colors">
                  <Sliders className="h-4 w-4" /> Specifications
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center gap-2 data-[state=active]:text-primary dark:data-[state=active]:text-primary transition-colors">
                  <MessageSquare className="h-4 w-4" /> Reviews
                </TabsTrigger>
              </TabsList>

              <div className="p-4">
                <TabsContent value="overview">
                  <DescriptionTab description={product.description} />
                </TabsContent>
                <TabsContent value="specs">
                  <SpecsTab
                    sku={product.sku}
                    brand={product.brands?.[0]?.name}
                    category={product.categories?.map((c) => c.name)}
                    availability={product.stock_status}
                    modelNumber={product.model_number}
                    weight={product.weight}
                    specifications={product.specifications}
                    tags={product.tags?.map((t) => t.name)}
                  />
                </TabsContent>
                <TabsContent value="reviews">
                  <ReviewsTab productId={String(product.id)} productSlug={product.slug} productName={product.name} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Recommendations — show related first, fall back to recently viewed, else placeholder */}
        {relatedProducts.length > 0 ? (
          <section className="py-4 mt-12">
            <ProductSection
              title="You Might Also Like"
              description="Discover similar products and accessories."
              items={relatedProducts}
            />
          </section>
        ) : recentlyViewedItems.length > 0 ? (
          <section className="py-4 mt-12">
            <ProductSection
              title="Recently Viewed"
              description="Products you browsed recently."
              items={recentlyViewedItems.slice(0, 4)}
            />
          </section>
        ) : (
          <section className="py-4 mt-12">
            <div className="text-center py-12 bg-gray-50 dark:bg-muted/20 rounded-xl">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                More Products Coming Soon
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                We're constantly updating our catalog. Check back later for more great products.
              </p>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
