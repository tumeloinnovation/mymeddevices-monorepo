"use client"

import React, { useEffect, useRef, useState } from 'react';
import { Star, X, Send, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { customerService } from '@/lib/services/customer-service';
import { toast } from 'sonner';

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  product_name?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  review: Review;
};

const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function EditReviewModal({ open, onClose, onSuccess, review }: Props) {
  const { user, isAuthenticated } = useAuthStore();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  // Initialize from review data
  useEffect(() => {
    if (open && review) {
      setRating(review.rating);
      setText(review.comment || '');
      setError(null);
    }
  }, [open, review]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      textRef.current?.focus();
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (!text.trim()) {
      setError('Please add a review');
      return;
    }

    if (rating < 1 || rating > 5) {
      setError('Please select a rating');
      return;
    }

    // Check if anything changed
    if (rating === review.rating && text.trim() === (review.comment || '')) {
      setError('No changes to save');
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const result = await customerService.updateReview(review.id, {
        rating: rating,
        comment: text.trim(),
      });

      // Check if review was flagged for profanity after update
      if ((result as any)?.contains_profanity) {
        toast.warning(
          'Review updated! Your review has been flagged for containing potentially inappropriate language and is under review.',
          { duration: 5000 }
        );
      } else {
        toast.success('Review updated successfully!');
      }

      // Reset form
      setText('');
      setRating(5);
      onClose();

      // Refresh reviews list
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const errMsg = err?.detail || err?.error || err?.message || 'Failed to update review';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsPending(false);
    }
  }

  const displayRating = hoverRating ?? rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-card rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="relative bg-white dark:bg-card px-6 py-4 border-b dark:border-border">
          <div className="relative flex items-start justify-between ">
            <div>
              <p className="text-lg font-semibold text-foreground">Edit Your Review</p>
              <p className="text-sm text-muted-foreground mt-0.5">{review.product_name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 dark:bg-muted hover:bg-gray-200 dark:hover:bg-muted/80 text-foreground transition-colors duration-200 flex-shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Star Rating Section */}
        <div className="px-6 py-5 bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/10">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground mb-3">How would you rate this product?</p>
            <div className="flex items-center justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const val = i + 1;
                const active = displayRating >= val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRating(val)}
                    onMouseEnter={() => setHoverRating(val)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="group p-1.5 rounded-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    aria-label={`${val} star${val > 1 ? 's' : ''}`}
                    aria-pressed={rating === val}
                  >
                    <Star
                      className={`h-8 w-8 transition-all duration-200 ${active
                        ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                        : 'text-gray-300 dark:text-gray-600 group-hover:text-yellow-300'
                        }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className={`mt-2 text-sm font-medium transition-all duration-200 ${displayRating >= 4 ? 'text-green-600 dark:text-green-400' :
              displayRating >= 3 ? 'text-yellow-600 dark:text-yellow-400' :
                'text-orange-600 dark:text-orange-400'
              }`}>
              {ratingLabels[displayRating - 1]}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="px-6 pb-6 space-y-4">
          {/* Error Messages */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="flex-shrink-0 w-1.5 h-1.5 bg-red-500 rounded-full" />
                {error}
              </p>
            </div>
          )}

          {/* Review Textarea */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Your Review
            </label>
            <textarea
              ref={textRef}
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-muted/50 border border-gray-200 dark:border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 resize-none"
              rows={4}
              placeholder="Share your experience with this product. What did you like or dislike?"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{text.length}/500 characters</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-muted/50 rounded-xl transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Update Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
