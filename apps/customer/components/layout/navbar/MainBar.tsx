'use client';
import { Menu, Phone, User, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { FC } from 'react';
import { toast } from 'sonner';
import { MainBarIcons } from './MainBarIcons';
import { SearchBar } from './SearchBar';

interface MainBarProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
}

export const MainBar: FC<MainBarProps> = ({ isMenuOpen, toggleMenu }) => {
  return (
    <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-x-2 md:gap-x-4">
      {/* Left Section */}
      <div className="flex items-center gap-x-2 md:gap-x-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logos/logo-landscape.png"
            alt="MyMedDevices Logo"
            width={180}
            height={40}
            className="object-contain w-32 md:w-40 xl:w-44 h-auto transition-all duration-300"
          />
        </Link>

        {/* Phone contact - moved into left for breathing room */}
        <Link
          href="tel:+254734585958"
          className="hidden lg:flex items-center gap-x-2 text-sm text-muted-foreground hover:text-primary"
          title="Call us"
        >
          <Phone size={16} className="text-muted-foreground" />
          <div className="text-left">
            <p className="text-[10px]">Call us</p>
            <p className="text-[12px] font-semibold">+254 707 757 088</p>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className="flex-grow min-w-0 md:min-w-[200px]">
        <SearchBar placeholder="Search medical devices, equipment, essentials..." />
      </div>
      {/* Icons */}
      <div className="flex items-center gap-x-2 md:gap-x-4.5">
        <MainBarIcons />
        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden p-2 rounded-md hover:bg-muted transition-all duration-200 hover:scale-110 active:scale-95"
          onClick={toggleMenu}
        >
          <div className="relative w-6 h-6">
            <Menu
              size={24}
              className={`absolute inset-0 transition-all duration-300 ${isMenuOpen ? 'opacity-0 rotate-180 scale-75' : 'opacity-100 rotate-0 scale-100'
                }`}
            />
            <X
              size={24}
              className={`absolute inset-0 transition-all duration-300 ${isMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-75'
                }`}
            />
          </div>
        </button>
      </div>
    </div>
  );
};
