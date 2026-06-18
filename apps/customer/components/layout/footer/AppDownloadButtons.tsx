import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AppStoreButtonProps {
  href: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

const AppStoreButton: React.FC<AppStoreButtonProps> = ({ href, src, alt, width, height }) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-block transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg"
  >
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className="object-contain"
      style={{ height: 'auto' }}
    />
  </Link>
);

const AppDownloadButtons: React.FC = () => {
  const appStores = [
    {
      href: "https://apps.apple.com/",
      src: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg",
      alt: "Download on the App Store",
      width: 120,
      height: 40,
    },
    {
      href: "https://play.google.com/store/apps/details?id=com.tumeloinnovations.my_med_devices&hl=en",
      src: "https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg",
      alt: "Get it on Google Play",
      width: 135,
      height: 40,
    },
    // {
    //   href: "https://appgallery.huawei.com/",
    //   src: "https://upload.wikimedia.org/wikipedia/commons/5/57/Huawei_AppGallery_badge.png",
    //   alt: "Explore it on AppGallery",
    //   width: 135,
    //   height: 40,
    // },
  ];

  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
        Download Our App
      </h4>
      <div className="flex flex-wrap items-center gap-3">
        {appStores.map((store, index) => (
          <AppStoreButton
            key={index}
            href={store.href}
            src={store.src}
            alt={store.alt}
            width={store.width}
            height={store.height}
          />
        ))}
      </div>
    </div>
  );
};

export default AppDownloadButtons;