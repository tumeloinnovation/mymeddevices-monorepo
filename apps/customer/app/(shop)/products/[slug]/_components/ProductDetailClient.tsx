'use client'

import { useState, useEffect } from 'react'
import type { Product, Review } from '@/lib/data/types'
import { useRecentlyViewedStore } from '@/lib/store/useRecentlyViewedStore'

import DescriptionTab from '@/app/(shop)/products/_components/DescriptionTab'
import ProductGallery from '@/app/(shop)/products/_components/ProductGallery'
import ProductSection from '@/components/common/ProductSection'
import ProductInfo from '@/app/(shop)/products/_components/ProductInfo'
import ReviewsTab from '@/app/(shop)/products/[slug]/_components/ReviewsTab'
import BundleConfigurator from '@/app/(shop)/products/[slug]/_components/BundleConfigurator'
import SpecsTab from '@/app/(shop)/products/_components/SpecsTab'
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
  const [addOnsTotal, setAddOnsTotal] = useState(0)

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
      url: `${SITE_URL}/products?category=${product.categories[0].slug}`
    }] : []),
    { name: product.name, url: productUrl }
  ]

  const isBundleProduct = product.product_type === 'bundle' || (product.bundle_items?.length ?? 0) > 0

  const tabsContent = (
    <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="gap-0">
      <TabsList className="relative h-auto w-full gap-1 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border justify-start">
        <TabsTrigger
          className="data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-border data-[state=active]:border-b-background! text-muted-foreground hover:text-foreground overflow-hidden rounded-t-lg rounded-b-none border border-transparent py-2.5 px-5 data-[state=active]:z-10 data-[state=active]:shadow-none! flex items-center gap-2 cursor-pointer font-medium text-sm transition-all"
          value="overview"
        >
          <FileText className="h-4 w-4" /> Overview
        </TabsTrigger>
        <TabsTrigger
          className="data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-border data-[state=active]:border-b-background! text-muted-foreground hover:text-foreground overflow-hidden rounded-t-lg rounded-b-none border border-transparent py-2.5 px-5 data-[state=active]:z-10 data-[state=active]:shadow-none! flex items-center gap-2 cursor-pointer font-medium text-sm transition-all"
          value="specs"
        >
          <Sliders className="h-4 w-4" /> Specifications
        </TabsTrigger>
        <TabsTrigger
          className="data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:border-border data-[state=active]:border-b-background! text-muted-foreground hover:text-foreground overflow-hidden rounded-t-lg rounded-b-none border border-transparent py-2.5 px-5 data-[state=active]:z-10 data-[state=active]:shadow-none! flex items-center gap-2 cursor-pointer font-medium text-sm transition-all"
          value="reviews"
        >
          <MessageSquare className="h-4 w-4" /> Reviews ({reviews?.length || 0})
        </TabsTrigger>
      </TabsList>
      <div className="pt-6 sm:pt-8 px-4 sm:px-6 md:px-8">
        <TabsContent value="overview" className="mt-0 outline-none">
          <DescriptionTab description={product.description} />
        </TabsContent>
        <TabsContent value="specs" className="mt-0 outline-none">
          <SpecsTab
            sku={product.sku}
            brand={product.brands?.[0]?.name || (product as any).brand}
            category={product.categories?.map((c) => c.name)}
            availability={product.stock_status}
            modelNumber={product.model_number}
            weight={product.weight || (product as any).weight_kg}
            dimensions={(product as any).dimensions}
            warrantyInfo={(product as any).warranty_info}
            specifications={product.specifications}
            tags={product.tags?.map((t) => t.name)}
          />
        </TabsContent>
        <TabsContent value="reviews" className="mt-0 outline-none">
          <ReviewsTab productId={String(product.id)} productSlug={product.slug} productName={product.name} />
        </TabsContent>
      </div>
    </Tabs>
  )

  const renderProductInfo = (hidePurchase: boolean = false) => (
    <ProductInfo
      product={product}
      quantity={quantity}
      setQuantity={setQuantity}
      relatedProducts={relatedProducts}
      hidePurchaseActions={hidePurchase}
      extraPrice={isBundleProduct ? addOnsTotal : 0}
    />
  )

  return (
    <>
      <ProductJsonLd product={product} url={productUrl} />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <div className="container mx-auto px-4 py-6">

        {isBundleProduct ? (
          // 3-column layout for bundle products
          <div className="grid gap-6 lg:gap-8 items-start grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Gallery */}
            <div className="lg:col-span-4 lg:sticky lg:top-8">
              <ProductGallery images={images} selected={selectedImage} onSelect={setSelectedImage} />
            </div>

            {/* Middle Column: Product Info */}
            <div className="lg:col-span-4 xl:col-span-4">
              {renderProductInfo(true)}
            </div>

            {/* Right Column: Bundles & Add-ons */}
            <div className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-8">
              <BundleConfigurator
                product={product}
                relatedProducts={relatedProducts}
                quantity={quantity}
                setQuantity={setQuantity}
                onAddOnsChange={setAddOnsTotal}
              />
            </div>
          </div>
        ) : (
          // 2-column layout for simple products
          <div className="grid gap-6 lg:gap-8 items-start grid-cols-1 lg:grid-cols-2">
            {/* Left Column: Gallery */}
            <div className="lg:sticky lg:top-8">
              <ProductGallery images={images} selected={selectedImage} onSelect={setSelectedImage} />
            </div>

            {/* Right Column: Product Info */}
            <div>
              {renderProductInfo(false)}
            </div>
          </div>
        )}

        {/* Tabs Section - Full width below columns */}
        <div className="mt-8">
          {tabsContent}
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
