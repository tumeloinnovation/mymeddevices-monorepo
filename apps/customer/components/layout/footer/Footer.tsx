// src/components/footer/Footer.tsx

'use client';

import {
  ArrowUp,
  Headset,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useEffect, useRef, useState } from 'react';
import AppDownloadButtons from './AppDownloadButtons';
import { socialLinks, InstagramIcon, FacebookIcon, XIcon, TikTokIcon, WhatsAppIcon, LinkedInIcon, YouTubeIcon } from '@/components/ui/social-icons';

const footerLinks = {
  Company: [
    { title: 'About Us', href: '/about-us' },
    { title: 'Contact Us', href: '/contact-us' },
  ],
  Policies: [
    { title: 'Privacy Policy', href: '/privacy-policy' },
    { title: 'Terms & Conditions', href: '/terms-and-conditions' },
    { title: 'Shipping Policy', href: '/shipping-policy' },
    { title: 'Return Policy', href: '/return-policy' },
  ],
  Shop: [
    { title: 'All Products', href: '/products' },
    { title: 'Offers', href: '/offers' },
    { title: 'Best Sellers', href: '/best-sellers' },
    { title: 'New Arrivals', href: '/new-arrivals' },
  ],
  'Quick Links': [
    { title: 'Checkout', href: '/checkout' },
    { title: 'My Wishlist', href: '/wishlist' },
    { title: 'Compare Products', href: '/compare' },
  ],
};

const supportItems = [
  { icon: Mail, title: 'Email Support', content: 'support@mymeddevices.co.ke' },
  { icon: Phone, title: 'Phone Support', content: '+254 707 757 088' },
  {
    icon: Headset,
    title: 'Customer Service',
    content: '24/7 dedicated support',
  },
  { icon: MapPin, title: 'Head Office', content: 'Muchai Drive 47, Ngong RD' },
];

const paymentIcons = [
  // { name: "Visa", src: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg", width: 40 },

  // { name: "Mastercard", src: "https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg", width: 40 },

  // { name: "PayPal", src: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg", width: 60 },

  {
    name: 'M-Pesa',
    src: 'https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg',
    width: 60,
  },
];

const socialIcons = [
  { key: 'instagram', icon: InstagramIcon },
  { key: 'facebook', icon: FacebookIcon },
  { key: 'x', icon: XIcon },
  { key: 'tiktok', icon: TikTokIcon },
  { key: 'whatsapp', icon: WhatsAppIcon },
  { key: 'linkedin', icon: LinkedInIcon },
  { key: 'youtube', icon: YouTubeIcon },
];

const BackToTopButton: FC<{ isVisible: boolean; onClick: () => void }> = ({
  isVisible,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`fixed bottom-6 right-6 bg-secondary text-secondary-foreground w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-secondary/90 ${
      isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
    }`}
    aria-label="Go to top"
  >
    <ArrowUp size={24} />
  </button>
);

// --- MAIN FOOTER COMPONENT ---

export const Footer: FC = () => {
  const [isScrollButtonVisible, setScrollButtonVisible] = useState(false);
  const footerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const toggleVisibility = () => setScrollButtonVisible(window.scrollY > 300);
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      <footer ref={footerRef} className="bg-slate-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          {/* Top Section: Logo & Links */}
          <div className="pb-12">
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-start md:gap-8">
                <div className="md:w-1/3 lg:w-1/4">
                  <div className="relative w-[180px] h-10 mb-4">
                    <Image
                      src="/logos/logo-landscape.png"
                      alt="MyMedDevices Logo"
                      fill
                      className="object-contain"
                      sizes="180px"
                    />
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    Kenya&apos;s trusted online store for genuine home medical devices, healthcare equipment, and wellness essentials.
                  </p>
                  <div className="flex items-center gap-3">
                    {socialIcons.map((social, index) => {
                      const link = socialLinks[social.key as keyof typeof socialLinks];
                      if (!link) return null;
                      return (
                        <Link
                          key={index}
                          href={link.url}
                          aria-label={link.label}
                          className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-full hover:bg-primary transition-colors"
                        >
                          <social.icon />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 md:mt-0 md:w-2/3 lg:w-3/4 grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {Object.entries(footerLinks).map(([title, links]) => (
                    <div key={title}>
                      <h4 className="font-bold text-lg mb-4 text-white">{title}</h4>
                      <ul className="space-y-3">
                        {links.map((link) => (
                          <li key={link.title}>
                            <Link
                              href={link.href}
                              className="text-slate-300 hover:text-white transition-colors"
                            >
                              {link.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom block: Download Our App + Shop on The Go side-by-side */}
            <div>
              <div className="rounded-lg">
                <div className="flex flex-col md:flex-row md:items-start md:gap-8">
                  <div>
                    <AppDownloadButtons />
                  </div>

                  <div className="flex-1 mt-6 md:ml-10">
                    <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                      Shop on The Go
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                      {supportItems.map((item) => (
                        <div key={item.title} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <item.icon size={18} />
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">{item.title}</p>
                            <p className="text-xs text-slate-300">{item.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Copyright, Payments & Links */}
          <div className="py-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} MyMedDevices Kenya. All Rights Reserved.
            </p>

            <div className="flex items-center gap-4">
              {paymentIcons.map((icon) => (
                <div
                  key={icon.name}
                  className="bg-white rounded-md px-1 h-7 flex items-center justify-center"
                >
                  <Image
                    src={icon.src}
                    alt={`${icon.name} payment`}
                    width={icon.width}
                    height={18}
                    className="object-contain"
                    style={{ height: 'auto' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <BackToTopButton isVisible={isScrollButtonVisible} onClick={scrollToTop} />
    </>
  );
};
