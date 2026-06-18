'use client';

import React from 'react';
import Image from 'next/image';

const FloatingWhatsAppButton: React.FC = () => {
  const handleClick = () => {
    const message = encodeURIComponent(`MyMedDevices\n` + `Hello! I'm interested in your medical devices. Can you help me?`);
    window.open(`https://api.whatsapp.com/send?phone=254735239696&text=${message}`, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-green-300"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
    >
      <Image
        src="/svgs/whatsapp.svg"
        alt="WhatsApp"
        width={32}
        height={32}
      />
    </button>
  );
};

export default FloatingWhatsAppButton;