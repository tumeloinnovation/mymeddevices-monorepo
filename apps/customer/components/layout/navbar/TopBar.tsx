"use client";

import type { FC } from "react";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import { socialLinks, XIcon, TikTokIcon, InstagramIcon, FacebookIcon, WhatsAppIcon, LinkedInIcon, YouTubeIcon } from "@/components/ui/social-icons";

const TopBarLink: FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <Link href={href} className="text-xs text-muted-foreground hover:text-primary">
    {children}
  </Link>
);

interface TopBarProps {
  theme: string | undefined;
  setTheme: (theme: string) => void;
}

export const TopBar: FC<TopBarProps> = ({ theme, setTheme }) => (
  <div className=" border-b border-border hidden md:block">
    <div className="container mx-auto px-4 h-10 flex justify-between items-center">
      <div className="flex items-center gap-x-6">
        <TopBarLink href="/about-us">About Us</TopBarLink>
        <TopBarLink href="/offers">Offers</TopBarLink>
        <TopBarLink href="/return-policy">Returns & Refunds</TopBarLink>
        <TopBarLink href="/contact-us">Contact Us</TopBarLink>
      </div>
      <div className="flex items-center gap-x-2">

        <Link href={socialLinks.instagram.url} aria-label={socialLinks.instagram.label} className="text-muted-foreground hover:text-primary" target="_blank" rel="noopener noreferrer">
          <InstagramIcon />
        </Link>
        <Link href={socialLinks.facebook.url} aria-label={socialLinks.facebook.label} className="text-muted-foreground hover:text-primary" target="_blank" rel="noopener noreferrer">
          <FacebookIcon />
        </Link>
        <Link href={socialLinks.x.url} aria-label={socialLinks.x.label} className="text-muted-foreground hover:text-primary" target="_blank" rel="noopener noreferrer">
          <XIcon />
        </Link>
        {socialLinks.tiktok.url && (
          <Link href={socialLinks.tiktok.url} aria-label={socialLinks.tiktok.label} className="text-muted-foreground hover:text-primary" target="_blank" rel="noopener noreferrer">
            <TikTokIcon />
          </Link>
        )}
        <Link href={socialLinks.whatsapp.url} aria-label={socialLinks.whatsapp.label} className="text-muted-foreground hover:text-primary" target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon />
        </Link>
        <Link href={socialLinks.linkedin.url} aria-label={socialLinks.linkedin.label} className="text-muted-foreground hover:text-primary" target="_blank" rel="noopener noreferrer">
          <LinkedInIcon />
        </Link>
        <Link href={socialLinks.youtube.url} aria-label={socialLinks.youtube.label} className="text-muted-foreground hover:text-primary" target="_blank" rel="noopener noreferrer">
          <YouTubeIcon />
        </Link>

        {/* Theme Toggle moved from MainBar */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="hidden md:flex relative items-center"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-all" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all" />
        </button>
      </div>
    </div>
  </div>
);
