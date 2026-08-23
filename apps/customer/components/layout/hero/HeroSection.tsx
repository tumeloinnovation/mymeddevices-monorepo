"use client";

import type { FC } from "react";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CategoryCarousel } from "@/components/common/CategoryCarousel";
import { useCategories } from "@/lib/hooks/useCategories";
import { formatCurrency } from "@/lib/utils/utils";


const slides = [
	{
		badgeText: "BEST SELLER",
		announcement: "Foldable and durable design",
		title: "Pediatric Wheelchair",
		subtitle: "BT973-35/BA021",
		price: "13000",
		image: "/images/Pediatric-Wheelchair.png",
		bgColor: "bg-primary/5",
		slug: "wheelchair-peadiatric-bt973-35-ba021",
	},
	{
		badgeText: "NEW ARRIVAL",
		announcement: "Ideal for Carpal Tunnel recovery",
		title: "Wrist & Forearm Brace",
		subtitle: "Universal Support",
		price: "1920",
		image: "/images/Wrist-and-Forearm-Brace.png",
		bgColor: "bg-secondary/5",
		slug: "wrist-forearm-brace-universal",
	},
	{
		badgeText: "SALE",
		announcement: "Lightweight and ergonomic",
		title: "Walking Stick Tripod",
		subtitle: "Enhanced Stability",
		price: "2000",
		image: "/images/Walking-Sticks-Tripod.png",
		bgColor: "bg-accent/5",
		slug: "we-walking-stick-tripod",
	},
];

export const HeroSection: FC = () => {
	const [currentSlide, setCurrentSlide] = useState(0);
	const categories = useCategories();

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentSlide((prev) => (prev + 1) % slides.length);
		}, 5000); // Change slide every 5 seconds
		return () => clearInterval(timer);
	}, []);

	const slide = slides[currentSlide];

	return (
		<section className="container mx-auto px-4 py-4">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
				{/* --- Main Banner (Left Side) --- */}
				<div
					className={`lg:col-span-2 ${slide.bgColor} dark:bg-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center overflow-hidden relative min-h-[420px] md:min-h-[360px]`}
					style={{
						flexBasis: "0",
						flexGrow: 1,
					}}
				>
					<div className="md:w-1/2 text-center md:text-left">
						<div className="inline-flex items-center bg-background rounded-full p-1 pr-3 mb-4 shadow-sm">
							<span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full mr-2">
								{slide.badgeText}
							</span>
							<p className="text-sm text-foreground">{slide.announcement}</p>
							<ChevronRight size={16} className="text-muted-foreground ml-1" />
						</div>
						<h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
							{slide.title}
						</h1>
						<p className="text-3xl md:text-4xl font-bold text-primary leading-tight mb-2">
							{slide.subtitle}
						</p>
						<p className="text-sm text-muted-foreground mb-1">Starts from</p>
						<p className="text-4xl font-extrabold text-foreground mb-4">
							KSh {formatCurrency(parseInt(slide.price))}
						</p>
						<Link
							href={`/products/${slide.slug}`}
							className="inline-block bg-primary text-primary-foreground text-lg font-bold px-8 py-3 rounded-lg border border-[rgba(var(--primary-foreground)/0.12)] dark:border-[rgba(var(--primary-foreground)/0.18)] hover:bg-primary/90 transition-transform duration-300 ease-in-out transform hover:scale-105 motion-safe:animate-micro-pulse focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 dark:focus-visible:ring-primary/30"
						>
							SHOP NOW
						</Link>
					</div>
					<div className="md:w-1/2 mt-4 md:mt-0 relative h-64 md:h-auto flex items-center justify-center">
						<div className="relative w-full max-w-[420px] h-[220px] md:h-[320px] lg:h-[360px]">
							<Image
								src={slide.image}
								alt="Modern Medical Device"
								fill
								sizes="(max-width: 768px) 60vw, (max-width: 1200px) 40vw, 50vw"
								className="object-contain transform transition-transform duration-500 ease-in-out hover:scale-105"
							/>
						</div>
					</div>
					<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
						{Array.isArray(slides) && slides.map((_, index) => (
							<button
								key={index}
								onClick={() => setCurrentSlide(index)}
								className={`w-3 h-3 rounded-full ${
									currentSlide === index ? "bg-primary" : "bg-muted"
								}`}
							></button>
						))}
					</div>
				</div>

				{/* --- Side Cards (Right Side) --- */}
				<div className="flex flex-col gap-4">
					<div className="bg-primary/10 dark:bg-primary/5 rounded-3xl p-6 flex justify-between items-center h-full transform transition-transform duration-300 ease-in-out hover:scale-105 flex-1 min-h-[180px] md:min-h-[180px] lg:min-h-[160px]">
						<div className="flex-1">
							<h3 className="text-2xl font-bold text-foreground dark:text-white mb-2">
								Mobility Solutions
							</h3>
							<Link
								href="/products?category=mobility-rehabilitation-aids"
								className="font-medium text-muted-foreground dark:text-slate-300 hover:text-primary inline-flex items-center"
							>
								View more <ArrowRight size={16} className="ml-1" />
							</Link>
						</div>
						<div className="w-28 h-28 md:w-32 md:h-32 flex items-center justify-center">
							<Image
								src="/images/wheelchair.png"
								alt="Modern Wheelchair"
								width={140}
								height={140}
								className="object-contain"
							/>
						</div>
					</div>
					<div className="bg-secondary/10 dark:bg-secondary/5 rounded-3xl p-6 flex justify-between items-center h-full transform transition-transform duration-300 ease-in-out hover:scale-105 flex-1 min-h-[180px] md:min-h-[180px] lg:min-h-[160px]">
						<div className="flex-1">
							<h3 className="text-2xl font-bold text-foreground dark:text-white mb-2">
								Diagnostic Equipment
							</h3>
							<p className="text-muted-foreground dark:text-slate-300 mb-2">
								Up to 20% Discount
							</p>
							<Link
								href="/products?category=diagnostic-devices"
								className="font-medium text-muted-foreground dark:text-slate-300 hover:text-primary inline-flex items-center"
							>
								View more <ArrowRight size={16} className="ml-1" />
							</Link>
						</div>
						<div className="w-28 h-28 md:w-32 md:h-32 flex items-center justify-center">
							<Image
								src="/images/digital_bp.png"
								alt="Digital Blood Pressure Monitor"
								width={140}
								height={140}
								className="object-contain"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* --- Category Filters --- */}
			<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
				<CategoryCarousel items={Array.isArray(categories) ? categories.map(cat => cat.name) : []} speed={50} />
			</div>
		</section>
	);
};
