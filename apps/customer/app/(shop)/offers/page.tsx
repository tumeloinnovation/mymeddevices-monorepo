import type { Metadata } from "next";
import OffersPage from "./_components/OffersPage";

export const metadata: Metadata = {
  title: "Exclusive Medical Device Offers | MyMedDevices",
  description:
    "Discover unbeatable deals on trusted medical equipment. From home monitoring devices to professional clinic bundles, find everything you need at exceptional prices.",
  keywords:
    "medical devices offers, medical equipment deals, healthcare discounts, medical supplies promotions, clinic bundles, home medical devices",
  openGraph: {
    title: "Exclusive Medical Device Offers | MyMedDevices",
    description:
      "Discover unbeatable deals on trusted medical equipment. From home monitoring devices to professional clinic bundles.",
    type: "website",
  },
};

export default function Offers() {
  return <OffersPage />;
}
