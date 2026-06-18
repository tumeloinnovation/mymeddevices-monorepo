"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length) {
      router.push(`/products?search=${encodeURIComponent(q)}`);
    } else {
      router.push(`/products`);
    }
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-2">404</h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Page not found</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-xl">
            We couldn&#39;t find the page you&#39;re looking for. Try searching our catalog, go back to the
            homepage, or contact support for quick help.
          </p>

          <form onSubmit={onSubmit} className="flex items-center max-w-lg mx-auto md:mx-0 gap-2">
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <input
              id="site-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products (e.g. blood pressure monitor)"
              className="flex-grow h-12 px-4 border border-border rounded-md bg-background text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="submit" className="whitespace-nowrap px-4" aria-label="Search">
              <Search className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Search</span>
            </Button>
          </form>

          <div className="mt-6 flex gap-3 justify-center md:justify-start">
            <Link href="/">
              <Button>Continue shopping</Button>
            </Link>
            <Link href="/products">
              <Button variant="outline">Browse products</Button>
            </Link>
            <Link href="/contact-us">
              <Button variant="ghost">Contact support</Button>
            </Link>
          </div>

          <div className="mt-8 text-sm text-slate-500 dark:text-slate-400">
            <p className="mb-2">Popular pages:</p>
            <ul className="flex flex-wrap gap-3">
              <li>
                <Link href="/products" className="underline">
                  All products
                </Link>
              </li>
              <li>
                <Link href="/offers" className="underline">
                  Offers
                </Link>
              </li>
              <li>
                <Link href="/compare" className="underline">
                  Compare products
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 shadow-lg">
            <Image
              src="/logos/logo-portrait.png"
              alt="Logo"
              width={640}
              height={420}
              className="rounded-lg object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
