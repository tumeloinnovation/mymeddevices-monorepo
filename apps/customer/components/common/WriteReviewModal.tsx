"use client"

import React, { useEffect, useRef, useState } from 'react';
import { Star, X, Send, User, Mail, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  onClose: () => void;
  productId: number | string;
};

const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function WriteReviewModal({ open, onClose }: Props) {
  const { user, isAuthenticated } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);

  // Auto-populate name and email from authenticated user
  useEffect(() => {
    if (open && isAuthenticated && user) {
      const displayName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '';
      setName(displayName);
      setEmail(user.email || '');
    }
  }, [open, isAuthenticated, user]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      nameRef.current?.focus();
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
    if (!name.trim()) return setError('Please enter your name');
    if (!email.trim()) return setError('Please enter your email');
    if (!text.trim()) return setError('Please add a short review');
    setError(null);

    setIsPending(true);
    // Mock review submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsPending(false);
    toast.success('Review submitted successfully !');
    onClose();
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
              <p className="text-lg font-semibold text-foreground">Write a Review</p>
              <p className="text-sm text-muted-foreground mt-0.5">Share your experience </p>
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

          {/* Name & Email Inputs - Only show for non-authenticated users */}
          {!isAuthenticated && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Your Name
                </label>
                <input
                  ref={nameRef}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-muted/50 border border-gray-200 dark:border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Your Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-muted/50 border border-gray-200 dark:border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200"
                  placeholder="Enter your email address"
                />
              </div>
            </>
          )}

          {/* Review Textarea */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Your Review
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-muted/50 border border-gray-200 dark:border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 resize-none"
              rows={4}
              placeholder="Share your experience with this product. What did you like or dislike?"
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
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
