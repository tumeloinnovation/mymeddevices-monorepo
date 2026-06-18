'use client';

import Image from 'next/image';
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// export const metadata = {
// 	title: 'About Us - MyMedDevices',
// 	description:
// 		'MyMedDevices is Kenya’s trusted online provider of affordable, genuine home-based medical devices and equipment.',
// };

export default function AboutPage() {
	return (
		<div className="container mx-auto px-4 py-16 space-y-24">
			{/* Hero Section */}
			<section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					whileInView={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
				>
					<p className="text-sm font-semibold text-primary mb-2 tracking-wide uppercase">
						About MyMedDevices
					</p>
					<h1 className="text-3xl md:text-5xl font-extrabold text-foreground leading-tight mb-6">
						Kenya’s most trusted store for home-based medical devices
					</h1>
					<p className="text-muted-foreground mb-8 max-w-xl">
						At <strong>MyMedDevices</strong>, we bring care and convenience to your doorstep.
						From diagnostic tools to mobility aids, we make home healthcare simpler,
						more affordable, and accessible for every Kenyan household.
					</p>

					<div className="flex flex-col sm:flex-row gap-4">
						<Link
							href="/products"
							className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow hover:opacity-95 transition"
							aria-label="Shop our medical products"
						>
							Shop Products
						</Link>
						<Link
							href="/contact-us"
							className="inline-flex items-center justify-center border border-border text-foreground px-6 py-3 rounded-lg font-medium hover:bg-muted transition"
							aria-label="Contact MyMedDevices team"
						>
							Contact Us
						</Link>
					</div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					whileInView={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.7 }}
					className="relative order-first lg:order-last w-full h-72 sm:h-80 lg:h-[28rem] rounded-2xl overflow-hidden shadow-xl"
				>
					<Image
						src="/images/kenyan-family-care.png"
						alt="Kenyan family using home-based medical devices"
						fill
						sizes="(max-width: 768px) 100vw, 50vw"
						className="object-cover"
						priority
					/>
				</motion.div>
			</section>

			{/* Mission, Vision, Values */}
			<section>
				<h2 className="text-2xl font-bold mb-8 text-center">Our Guiding Principles</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{[
						{
							title: 'Our Mission',
							text: 'To provide affordable, high-quality medical devices that empower Kenyans to manage their health confidently at home.',
						},
						{
							title: 'Our Vision',
							text: 'A healthier Kenya where every home has access to reliable tools for safe, independent care.',
						},
						{
							title: 'Our Values',
							text: 'Trust, affordability, and customer-first service define every product and interaction.',
						},
					].map((item) => (
						<motion.div
							key={item.title}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5 }}
							className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:shadow-md transition"
						>
							<h3 className="text-lg font-bold mb-2">{item.title}</h3>
							<p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
						</motion.div>
					))}
				</div>
			</section>

			{/* Stats Section */}
			<section className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
				{[
					{ number: '10k+', label: 'Happy Customers' },
					{ number: '500+', label: 'Verified Products' },
					{ number: 'Same/Next-Day', label: 'Delivery within Nairobi' },
				].map((stat, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, scale: 0.9 }}
						whileInView={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5 }}
						className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/5 border border-border shadow-sm"
					>
						<h4 className="text-4xl font-extrabold mb-1 text-foreground">{stat.number}</h4>
						<p className="text-sm text-muted-foreground">{stat.label}</p>
					</motion.div>
				))}
			</section>

			{/* Call to Action */}
			<section className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-border rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
				<div>
					<h3 className="text-xl font-bold mb-2">
						Ready to get the right equipment for home care?
					</h3>
					<p className="text-sm text-muted-foreground">
						Browse our catalog or reach out to our support team for expert guidance.
					</p>
				</div>
				<div className="flex gap-4">
					<Link
						href="/products"
						className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow hover:opacity-95 transition"
					>
						Shop Now
					</Link>
					<Link
						href="/contact-us"
						className="border border-border px-6 py-3 rounded-lg font-medium hover:bg-muted transition"
					>
						Contact Us
					</Link>
				</div>
			</section>
		</div>
	);
}
