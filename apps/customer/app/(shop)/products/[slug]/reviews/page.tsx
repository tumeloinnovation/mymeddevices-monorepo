import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, User } from 'lucide-react'
import ReviewsTab from '../_components/ReviewsTab'

const SITE_URL = 'https://mymeddevices.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Props = {
  params: Promise<{ slug: string }>
}

async function fetchProduct(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/storefront/products/${slug}`, {
      next: { revalidate: 3600 }
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data || json
  } catch (e) {
    return null
  }
}

async function fetchReviews(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/storefront/products/${slug}/reviews`, {
      next: { revalidate: 60 } // Cache for 1 minute
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || json.reviews || (Array.isArray(json) ? json : [])
  } catch (e) {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProduct(slug)
  if (!product) return { title: 'Reviews Not Found' }
  return {
    title: `Customer Reviews & Ratings — ${product.name}`,
    description: `Read authentic customer reviews and ratings for ${product.name} at MyMedDevices Kenya.`
  }
}

export default async function ProductReviewsPage({ params }: Props) {
  const { slug } = await params
  const product = await fetchProduct(slug)

  if (!product) notFound()

  const reviews = await fetchReviews(slug)

  // Calculate stats
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0

  const verifiedCount = reviews.filter((r: any) => r.is_verified_purchase).length

  // Rating distribution
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach((r: any) => {
    ratingCounts[r.rating as keyof typeof ratingCounts]++
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/products/${slug}`} className="p-2 rounded-lg border dark:border-border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-muted transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Customer Reviews</h1>
          <p className="text-sm text-gray-500 dark:text-muted-foreground">{product.name}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-card border dark:border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-4xl font-extrabold text-gray-900 dark:text-foreground">{avgRating.toFixed(1)}</span>
              <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">out of 5 stars</p>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-2">Based on {reviews.length} reviews</p>
            </div>
            <div className="flex text-amber-400 gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < Math.round(avgRating) ? 'fill-current' : 'opacity-30'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white dark:bg-card border dark:border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 dark:text-foreground mb-4">Rating Breakdown</h3>
          <div className="space-y-2">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = ratingCounts[star]
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="w-12 text-sm">{star}★</div>
                  <div className="flex-1 bg-gray-100 dark:bg-muted/30 rounded h-3 overflow-hidden">
                    <div className="bg-amber-400 h-3 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-8 text-right text-sm text-gray-600 dark:text-muted-foreground">{count}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Verified Badge */}
      {verifiedCount > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
          <p className="text-sm text-green-800 dark:text-green-400">
            ✓ {verifiedCount} verified purchase reviews out of {reviews.length} total reviews
          </p>
        </div>
      )}

      {/* Interactive Reviews Component */}
      <ReviewsTab productSlug={slug} productId={String(product.id)} productName={product.name} />
    </div>
  )
}
