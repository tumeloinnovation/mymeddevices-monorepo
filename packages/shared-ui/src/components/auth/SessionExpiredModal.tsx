'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff, ShieldAlert, LogOut, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionExpiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onLogin: (password: string) => Promise<void>;
  onLogout: () => void;
}

export function SessionExpiredModal({
  open,
  onOpenChange,
  email,
  onLogin,
  onLogout,
}: SessionExpiredModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus password input when modal opens
  useEffect(() => {
    if (open) {
      setPassword('');
      setError(null);
      setShowPassword(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onLogin(password);
      toast.success('Session restored successfully!');
      onOpenChange(false);
    } catch (err: any) {
      console.error('Session restoration failed:', err);
      setError(err?.message || 'Invalid password. Please try again.');
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent closing the modal by clicking outside or pressing Escape (force interaction)
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // User is trying to close the modal. We don't allow it directly,
      // they must either login or explicitly click Logout.
      toast.error('Please enter your password or log out to continue.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-border/40 shadow-2xl bg-background/95 backdrop-blur-md rounded-2xl">
        {/* Visually hidden title for screen readers */}
        <DialogTitle className="sr-only">Session Disconnected</DialogTitle>

        <div className="flex flex-col">
          {/* Header warning Banner */}
          <div className="bg-destructive/10 border-b border-destructive/20 p-6 flex items-start gap-4 text-destructive-foreground">
            <div className="p-3 rounded-full bg-destructive/15 text-destructive shrink-0">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-foreground text-lg leading-tight">Session Disconnected</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For security reasons, your login session has expired. Enter your password to pick up right where you left off.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
            {/* User Profile display */}
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/40 border border-muted-foreground/10">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                {email ? email.substring(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Account</span>
                <span className="text-sm font-semibold text-foreground truncate">{email}</span>
              </div>
            </div>

            {/* Password input section */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="session-password" className="text-sm font-medium text-foreground">
                  Verify Password
                </Label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <Input
                  ref={inputRef}
                  id="session-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 py-5 bg-background border-border/80 focus-visible:ring-primary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>

              {/* Animate error display */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-xs font-medium text-destructive mt-1 flex items-center gap-1.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-destructive inline-block" />
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row-reverse gap-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:flex-1 py-5 font-semibold gap-2 shadow-lg shadow-primary/15 hover:shadow-primary/25 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onLogout}
                disabled={isLoading}
                className="w-full sm:w-auto font-medium gap-2 border-border/80 hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
