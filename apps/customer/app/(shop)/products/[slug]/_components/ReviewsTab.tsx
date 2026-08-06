'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { User, Star, MessageSquare, Edit, Trash2 } from 'lucide-react'
import WriteReviewModal from '@/components/common/WriteReviewModal'
import EditReviewModal from '@/components/common/EditReviewModal'
import { LoginModal } from '@/components/auth/LoginModal'
import { useAuthStore } from '@/lib/store/useAuthStore'
import { customerService } from '@/lib/services/customer-service'
import { toast } from 'sonner'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Review = {
  id: string
  customer_id?: string
  rating: number
  comment: string | null
  is_verified_purchase: boolean
  created_at: string
  reviewer_name: string
}

type Props = {
  productSlug: string
  productId?: string
  productName?: string
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center text-yellow-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? 'opacity-100' : 'opacity-30'}`} />
      ))}
    </div>
  )
}

export default function ReviewsTab({ productSlug, productId, productName }: Props) {
  const { user, isAuthenticated } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [filterStar, setFilterStar] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'recent' | 'top'>('recent')
  const [visible, setVisible] = useState(5)
  const [actualProductId, setActualProductId] = useState<string>(productId || '')

  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Resolve UUID if only slug was provided
  useEffect(() => {
    if (productId) {
      setActualProductId(productId)
      return
    }
    if (productSlug) {
      fetch(`${API_URL}/api/v1/storefront/products/${productSlug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.id) {
            setActualProductId(String(data.data.id))
          }
        })
        .catch(() => {})
    }
  }, [productId, productSlug])

  // Fetch reviews from API
  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/v1/storefront/products/${productSlug}/reviews`)
      if (!response.ok) {
        throw new Error('Failed to load reviews')
      }
      const result = await response.json()
      setReviews(result.data || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Failed to fetch reviews:', err)
    } finally {
      setLoading(false)
    }
  }, [productSlug])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      setLoginOpen(true)
    } else {
      setOpen(true)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete your review?')) return
    try {
      await customerService.deleteReview(reviewId)
      toast.success('Review deleted successfully')
      fetchReviews()
    } catch (error: any) {
      toast.error(error?.detail || error?.message || 'Failed to delete review')
    }
  }

  const sorted = [...reviews].sort((a, b) =>
    sortBy === 'recent'
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : b.rating - a.rating
  )

  const filteredReviews = filterStar
    ? sorted.filter((r) => r.rating === filterStar)
    : sorted

  const avg =
    Math.round(
      (reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1)) * 10
    ) / 10 || 0

  const counts = [5, 4, 3, 2, 1].map(
    (st) => reviews.filter((l) => l.rating === st).length
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 bg-white dark:bg-card rounded-md border dark:border-border">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white dark:bg-card rounded-md border dark:border-border">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400 dark:text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-foreground">Failed to load reviews</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-muted-foreground">
          {error}
        </p>
        <button
          onClick={fetchReviews}
          className="mt-4 px-4 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-card rounded-md border dark:border-border transition-colors duration-300">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400 dark:text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-foreground">No reviews yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-muted-foreground">
          Be the first to share your thoughts on this product.
        </p>
        <div className="mt-6">
          <button
            onClick={handleWriteReview}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition"
          >
            Write a review
          </button>
        </div>
        <WriteReviewModal
          open={open}
          onClose={() => setOpen(false)}
          productId={actualProductId}
          onSuccess={fetchReviews}
        />
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </div>
    )
  }

  return (
    <div className="space-y-6 transition-colors duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* --- Left Summary Panel --- */}
        <div className="md:col-span-1 flex flex-col gap-4 bg-white dark:bg-card border dark:border-border rounded-md p-4 transition-colors">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-gray-900 dark:text-foreground">{avg.toFixed(1)}</div>
            <div>
              <div className="text-sm text-gray-500 dark:text-muted-foreground">Average rating</div>
              <div className="flex items-center mt-1"><Stars rating={Math.round(avg)} /></div>
              <div className="text-sm text-gray-500 dark:text-muted-foreground mt-1">Based on {reviews.length} reviews</div>
            </div>
          </div>

          <div className="space-y-2">
            {([5, 4, 3, 2, 1] as const).map((st, idx) => {
              const c = counts[idx]
              const total = reviews.length || 1
              const pct = Math.round((c / total) * 100)
              return (
                <button
                  key={st}
                  onClick={() => setFilterStar(filterStar === st ? null : st)}
                  className={`w-full flex items-center gap-3 p-2 rounded-md border dark:border-border transition-colors ${filterStar === st ? 'bg-primary/10 dark:bg-primary/20' : 'bg-gray-50 dark:bg-muted/30'}`}
                >
                  <div className="w-6 text-sm">{st}★</div>
                  <div className="flex-1 bg-white dark:bg-card rounded h-3 overflow-hidden">
                    <div className="bg-yellow-400 h-3" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-8 text-right text-sm text-gray-600 dark:text-muted-foreground">{c}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* --- Reviews List --- */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 dark:text-muted-foreground">Sort by</div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'top')}
                className="border dark:border-border dark:bg-card rounded px-2 py-1 text-sm text-gray-800 dark:text-foreground"
              >
                <option value="recent">Most recent</option>
                <option value="top">Top rated</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 dark:text-muted-foreground">
                Showing {Math.min(visible, filteredReviews.length)} of {filteredReviews.length}
              </div>
              <button onClick={handleWriteReview} className="px-3 py-2 bg-primary text-white rounded text-sm hover:bg-primary/90 transition">
                Write a review
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReviews.slice(0, visible).map((review) => {
              const isMyReview = isAuthenticated && user && review.customer_id && (review.customer_id === (user as any).customer_profile_id || review.customer_id === user.id)

              return (
                <article key={review.id} className="p-4 border dark:border-border rounded-md bg-white dark:bg-card transition-colors">
                  <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-gray-100 dark:bg-muted/30 p-2">
                        <User className="h-5 w-5 text-gray-600 dark:text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2 text-gray-900 dark:text-foreground">
                          {review.reviewer_name || 'Anonymous'}
                          {review.is_verified_purchase && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Stars rating={review.rating} />
                      {isMyReview && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => {
                              setEditingReview(review)
                              setEditModalOpen(true)
                            }}
                            className="p-1 text-gray-500 hover:text-primary transition"
                            title="Edit your review"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-1 text-gray-500 hover:text-red-600 transition"
                            title="Delete your review"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </header>
                  {review.comment && (
                    <p className="mt-3 text-gray-700 dark:text-foreground whitespace-pre-line">{review.comment}</p>
                  )}
                </article>
              )
            })}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3 border-t dark:border-border pt-4">
            {visible < filteredReviews.length && (
              <button
                onClick={() => setVisible((v) => v + 5)}
                className="px-4 py-2 border dark:border-border rounded text-sm text-gray-700 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted/20 transition"
              >
                Load more reviews
              </button>
            )}

            <Link
              href={`/products/${productSlug}/reviews`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
            >
              <span>Open all reviews on dedicated review page &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      <WriteReviewModal
        open={open}
        onClose={() => setOpen(false)}
        productId={actualProductId}
        onSuccess={fetchReviews}
      />

      {editingReview && (
        <EditReviewModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          review={{
            id: editingReview.id,
            rating: editingReview.rating,
            comment: editingReview.comment ?? null,
            product_name: productName,
          }}
          onSuccess={() => {
            setEditModalOpen(false)
            fetchReviews()
          }}
        />
      )}

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  )
}
