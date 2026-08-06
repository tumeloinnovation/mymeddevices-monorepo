'use client'

import { useEffect, useState } from 'react'
import { Star, Flag, Shield, Eye, EyeOff, Trash2, Filter, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { apiClient } from '@mymeddevices/shared-core'

type Review = {
  id: string
  rating: number
  comment: string | null
  is_verified_purchase: boolean
  contains_profanity: boolean
  flagged_words: string[] | null
  moderation_status: 'visible' | 'hidden' | 'removed'
  created_at: string
  customer_name: string | null
  customer_email: string | null
  product_name: string | null
}

type Summary = {
  total_reviews: number
  average_rating: number
  visible_reviews: number
  hidden_reviews: number
  removed_reviews: number
  flagged_profanity: number
  verified_purchases: number
  rating_distribution: Record<string, number>
}

export default function VendorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'flagged' | 'visible' | 'hidden' | 'removed'>('all')
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filter !== 'all') {
        params.moderation_status = filter
      }

      const response: any = await apiClient.get('/vendors/me/reviews', { params })
      const data = response?.data ?? response
      setReviews(data?.reviews || [])

      try {
        const summaryRes: any = await apiClient.get('/vendors/me/reviews/summary')
        const summaryData = summaryRes?.data ?? summaryRes
        setSummary(summaryData)
      } catch (e) {
        console.error('Failed to fetch summary:', e)
      }
    } catch (error: any) {
      toast.error(error?.detail || error?.message || 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [filter])

  const moderateReview = async (reviewId: string, action: 'visible' | 'hidden' | 'removed', reason?: string) => {
    try {
      await apiClient.put(`/vendors/me/reviews/${reviewId}/moderate`, {
        moderation_status: action,
        reason: reason || `Vendor changed status to ${action}`,
      })
      toast.success(`Review ${action} successfully`)
      fetchReviews()
    } catch (error: any) {
      toast.error(error?.detail || error?.message || 'Failed to moderate review')
    }
  }

  const filteredReviews = ratingFilter
    ? reviews.filter(r => r.rating === ratingFilter)
    : reviews

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Product Reviews</h1>
        <p className="text-muted-foreground">Manage and moderate reviews for your products</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Reviews</CardDescription>
              <CardTitle className="text-2xl">{summary.total_reviews}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {summary.average_rating} avg rating
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Visible</CardDescription>
              <CardTitle className="text-2xl text-green-600">{summary.visible_reviews}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Showing to customers</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Flagged Profanity</CardDescription>
              <CardTitle className="text-2xl text-orange-600">{summary.flagged_profanity}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Flag className="h-4 w-4" />
                Needs attention
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Verified Purchases</CardDescription>
              <CardTitle className="text-2xl text-blue-600">{summary.verified_purchases}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Confirmed buyers
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Status:</span>
              <div className="flex gap-1">
                {(['all', 'flagged', 'visible', 'hidden', 'removed'] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className="capitalize"
                  >
                    {f === 'flagged' ? '⚠️ Flagged' : f}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium">Rating:</span>
              <div className="flex gap-1">
                {[null, 5, 4, 3, 2, 1].map((r) => (
                  <Button
                    key={r ?? 'all'}
                    variant={ratingFilter === r ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRatingFilter(r)}
                  >
                    {r ? `${r}★` : 'All'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No reviews found matching the current filters.
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id} className={review.moderation_status === 'hidden' || review.moderation_status === 'removed' ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      {review.is_verified_purchase && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {review.contains_profanity && (
                        <Badge variant="destructive">
                          <Flag className="h-3 w-3 mr-1" />
                          Flagged
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {review.moderation_status}
                      </Badge>
                    </div>

                    <div className="text-sm">
                      <span className="font-medium">{review.customer_name || 'Anonymous'}</span>
                      {review.product_name && (
                        <>
                          {' '}on{' '}
                          <span className="text-muted-foreground">{review.product_name}</span>
                        </>
                      )}
                    </div>

                    {review.comment && (
                      <p className="text-sm">{review.comment}</p>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleString()}
                      {review.flagged_words && review.flagged_words.length > 0 && (
                        <span className="ml-2 text-orange-600">
                          Flagged words: {review.flagged_words.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="relative group">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <div className="absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-md p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 w-40">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => moderateReview(review.id, 'visible')}
                          disabled={review.moderation_status === 'visible'}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Show
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => moderateReview(review.id, 'hidden', 'Hidden by vendor')}
                          disabled={review.moderation_status === 'hidden'}
                        >
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-red-600"
                          onClick={() => moderateReview(review.id, 'removed', 'Removed by vendor')}
                          disabled={review.moderation_status === 'removed'}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
