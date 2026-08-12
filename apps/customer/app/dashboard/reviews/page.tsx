'use client'

import { useEffect, useState } from 'react'
import { Star, Flag, Shield, Edit, Trash2, MessageSquare, Store, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import Link from 'next/link'
import EditReviewModal from '@/components/common/EditReviewModal'
import { customerService, Review as CustomerReview } from '@/lib/services/customer-service'

type Review = CustomerReview & {
  product?: {
    id: string
    name: string
    slug?: string
    image_url?: string
  }
}

type Summary = {
  total_reviews: number
  average_rating: number
  verified_purchases: number
  rating_distribution: Record<string, number>
}

export default function CustomerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all')
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const reviewList = await customerService.getReviews()
      setReviews((reviewList as unknown as Review[]) || [])

      if (reviewList) {
        const total = reviewList.length
        const avgRating = total > 0
          ? reviewList.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / total
          : 0
        const verified = reviewList.filter((r: any) => r.is_verified_purchase).length

        const ratingDistribution: Record<string, number> = {
          '5': 0, '4': 0, '3': 0, '2': 0, '1': 0
        }
        reviewList.forEach((r: any) => {
          if (r.rating) {
            ratingDistribution[r.rating.toString()] = (ratingDistribution[r.rating.toString()] || 0) + 1
          }
        })

        setSummary({
          total_reviews: total,
          average_rating: Math.round(avgRating * 10) / 10,
          verified_purchases: verified,
          rating_distribution: ratingDistribution
        })
      }
    } catch (error: any) {
      toast.error(error?.detail || error?.message || 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      await customerService.deleteReview(reviewId)
      toast.success('Review deleted successfully')
      fetchReviews()
    } catch (error: any) {
      toast.error(error?.detail || error?.message || 'Failed to delete review')
    }
  }

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => r.moderation_status === filter)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Product Reviews</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track reviews you've submitted for purchased items.</p>
        </div>
        <Button onClick={fetchReviews} variant="outline" size="sm" className="text-xs h-9 gap-1.5 shrink-0 self-start sm:self-auto">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
        <div className="flex gap-1.5">
          {(['all', 'visible', 'hidden'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-8 px-3"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All Reviews' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        ) : filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No reviews yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                You haven't written any product reviews yet. Start shopping and leave reviews for products you've purchased!
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition"
              >
                Browse Products
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {filteredReviews.map((review) => (
              <Card
                key={review.id}
                className={
                  review.moderation_status === 'hidden' || review.moderation_status === 'removed'
                    ? 'opacity-60 border-dashed'
                    : ''
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Product Link & Rating */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          href={`/products/${review.product?.slug || ''}`}
                          className="font-medium text-foreground hover:text-primary transition"
                        >
                          {review.product?.name || 'Product'}
                        </Link>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {review.is_verified_purchase && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified Purchase
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className={
                            review.moderation_status === 'visible'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-400'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-400'
                          }
                        >
                          {review.moderation_status}
                        </Badge>
                      </div>

                      {/* Review Comment */}
                      {review.comment && (
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">{review.comment}</p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            Posted {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.updated_at !== review.created_at && (
                          <span>
                            Updated {new Date(review.updated_at).toLocaleDateString()}
                          </span>
                        )}
                        {review.moderation_status !== 'visible' && (
                          <span className="text-orange-600">
                            This review is not visible to other customers
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Edit Review"
                        onClick={() => {
                          setEditingReview(review)
                          setEditModalOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete Review"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteReview(review.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Edit Review Modal */}
      {editingReview && (
        <EditReviewModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          review={{
            id: editingReview.id,
            rating: editingReview.rating,
            comment: editingReview.comment ?? null,
            product_name: editingReview.product?.name,
          }}
          onSuccess={() => {
            setEditModalOpen(false)
            fetchReviews()
          }}
        />
      )}
    </div>
  )
}
