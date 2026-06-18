'use client'

import { useState } from 'react'
import { Mail, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/utils'

type Variant = 'compact' | 'wide'

export default function NewsletterSection({ variant = 'wide' }: { variant?: Variant }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3500)
    setEmail('')
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden border-t dark:border-border transition-colors duration-300',
        variant === 'wide' ? 'py-16 px-8 sm:px-12' : 'py-10 px-6'
      )}
    >
      {/* soft gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <div
        className={cn(
          'relative z-10 max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 animate-fade-up'
        )}
      >
        {/* Left content */}
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2 text-primary mb-2">
            <Mail className="h-5 w-5" />
            <span className="font-semibold">Newsletter</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Stay in the Loop
          </h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            Subscribe to receive new arrivals, special offers, and updates directly in your inbox.
          </p>
        </div>

        {/* Right content (form + message + privacy note) */}
        <div className="flex flex-col items-center lg:items-end w-full max-w-md lg:max-w-lg">
          {!submitted ? (
            <>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row items-center gap-3 w-full"
              >
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 bg-white dark:bg-card border dark:border-border focus-visible:ring-primary transition-colors"
                />
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  Subscribe
                </Button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground text-center sm:text-left lg:text-right">
                We respect your privacy. Unsubscribe anytime.
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center lg:justify-end gap-2 text-green-600 dark:text-green-400 mt-2 sm:mt-0">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Thank you! You’re subscribed.</span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-up {
          animation: fade-up 0.6s ease-out;
        }
      `}</style>
    </section>
  )
}
