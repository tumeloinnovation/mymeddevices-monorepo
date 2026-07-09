'use client'

import { useState } from 'react'
import type { Product, Review } from '@/lib/data/types'

import DescriptionTab from '@/app/(shop)/products/_components/DescriptionTab'
import ProductGallery from '@/app/(shop)/products/_components/ProductGallery'
import ProductSection from '@/components/common/ProductSection'
import ProductInfo from '@/app/(shop)/products/_components/ProductInfo'
import ReviewsTab from '@/app/(shop)/products/[slug]/_components/ReviewsTab'
import SpecsTab from '@/app/(shop)/products/_components/SpecsTab'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ShieldCheck, Truck, MapPin, FileText, MessageSquare, Sliders } from 'lucide-react'
import ProductNotFound from '../../_components/ProductNotFound'
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo'

const SITE_URL = 'https://mymeddevices.com'

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
  reviews: Review[];
}

export default function ProductDetailClient({ product, relatedProducts, reviews }: ProductDetailClientProps) {
  const [activeTab, setActiveTab] = useState('description')
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

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

      <div className="px-4 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ProductGallery images={images} selected={selectedImage} onSelect={setSelectedImage} />
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-600" /> 100% Authentic</div>
              <div className="flex items-center gap-2"><Truck className="h-5 w-5" /> Fast Delivery</div>
              <div className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Pickup Available</div>
            </div>
          </div>

          <div>
            <ProductInfo product={product} quantity={quantity} setQuantity={setQuantity} />
          </div>
        </div>

        <div className="mt-10">
          <div className="bg-white dark:bg-card border dark:border-border rounded-lg shadow-sm transition-colors duration-300">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="px-4 py-3 border-b dark:border-border bg-gray-50 dark:bg-muted/30 rounded-t-lg">
                <TabsTrigger value="description" className="flex items-center gap-2 data-[state=active]:text-primary dark:data-[state=active]:text-primary transition-colors">
                  <FileText className="h-4 w-4" /> Description
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center gap-2 data-[state=active]:text-primary dark:data-[state=active]:text-primary transition-colors">
                  <MessageSquare className="h-4 w-4" /> Reviews ({reviews.length})
                </TabsTrigger>
                <TabsTrigger value="specs" className="flex items-center gap-2 data-[state=active]:text-primary dark:data-[state=active]:text-primary transition-colors">
                  <Sliders className="h-4 w-4" /> Specifications
                </TabsTrigger>
              </TabsList>

              <div className="p-4">
                <TabsContent value="description">
                  <DescriptionTab description={product.description} />
                </TabsContent>
                <TabsContent value="reviews">
                  <ReviewsTab productId={product.id} reviews={reviews} />
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
              </div>
            </Tabs>
          </div>
        </div>

        <section className="py-2 mt-12">
          <ProductSection
            title="You may also like"
            description="Explore similar products that might interest you."
            items={relatedProducts}
          />
        </section>
      </div>
    </>
  )
}
