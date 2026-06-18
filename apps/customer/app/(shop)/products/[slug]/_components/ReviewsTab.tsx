'use client'

import React, { useState } from 'react'
import { User, Star, MessageSquare } from 'lucide-react'
import WriteReviewModal from '@/components/common/WriteReviewModal'
import { LoginModal } from '@/components/auth/LoginModal'
import { useAuthStore } from '@/lib/store/useAuthStore'
import type { Review } from '@/lib/data/types'

type Props = {
  productId: number | string
  reviews: Review[]
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

export default function ReviewsTab({ productId, reviews }: Props) {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [filterStar, setFilterStar] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'recent' | 'top'>('recent')
  const [visible, setVisible] = useState(5)

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      setLoginOpen(true);
    } else {
      setOpen(true);
    }
  }

  const sorted = [...reviews].sort((a, b) =>
    sortBy === 'recent'
      ? new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
      : b.rating - a.rating
  );

  const filteredReviews = filterStar
    ? sorted.filter((r) => r.rating === filterStar)
    : sorted;

  const avg =
    Math.round(
      (reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1)) * 10
    ) / 10 || 0;

  const counts = [5, 4, 3, 2, 1].map(
    (st) => reviews.filter((l) => l.rating === st).length
  );

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
        <WriteReviewModal open={open} onClose={() => setOpen(false)} productId={productId} />
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
                Showing {Math.min(visible, filteredReviews.length)} of {reviews.length}
              </div>
              <button onClick={handleWriteReview} className="px-3 py-2 bg-primary text-white rounded text-sm hover:bg-primary/90 transition">
                Write a review
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReviews.slice(0, visible).map((r, i) => (
              <article key={i} className="p-4 border dark:border-border rounded-md bg-white dark:bg-card transition-colors">
                <header className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gray-100 dark:bg-muted/30 p-2">
                      <User className="h-5 w-5 text-gray-600 dark:text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2 text-gray-900 dark:text-foreground">
                        {r.reviewer || 'Anonymous'}
                        {(r.verified || (r as any).is_verified_purchase) && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-muted-foreground">
                        {new Date(r.date_created || (r as any).created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Stars rating={r.rating} />
                </header>
                <div className="mt-3 text-gray-700 dark:text-foreground" dangerouslySetInnerHTML={{ __html: r.review || r.comment || '' }} />
              </article>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            {visible < filteredReviews.length ? (
              <button
                onClick={() => setVisible((v) => v + 5)}
                className="px-4 py-2 border dark:border-border rounded text-sm text-gray-700 dark:text-foreground hover:bg-gray-50 dark:hover:bg-muted/20 transition"
              >
                Load more
              </button>
            ) : (
              <div className="text-sm text-gray-500 dark:text-muted-foreground">No more reviews</div>
            )}
          </div>
        </div>
      </div>

      <WriteReviewModal open={open} onClose={() => setOpen(false)} productId={productId} />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  )
}
