'use client';

import { motion } from 'framer-motion';

/**
 * Time-of-day greeting with animated emoji
 * Returns appropriate greeting based on current hour
 */
export function TimeGreeting({ firstName }: { firstName?: string }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = firstName || 'Guest';

    if (hour >= 5 && hour < 12) {
      return { text: `Good morning, ${name}`, emoji: '☀️', period: 'morning' };
    } else if (hour >= 12 && hour < 17) {
      return { text: `Good afternoon, ${name}`, emoji: '🌤️', period: 'afternoon' };
    } else if (hour >= 17 && hour < 21) {
      return { text: `Good evening, ${name}`, emoji: '🌙', period: 'evening' };
    } else {
      return { text: `Good night, ${name}`, emoji: '🌃', period: 'night' };
    }
  };

  const { text, emoji } = getGreeting();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl md:text-4xl font-bold text-foreground">
        {text} {emoji}
      </h1>
      <p className="text-muted-foreground mt-2">
        Here's what's happening with your account
      </p>
    </motion.div>
  );
}
