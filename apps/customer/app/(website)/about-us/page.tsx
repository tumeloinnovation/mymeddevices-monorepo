'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  HeartHandshake,
  Award,
  Users,
  CheckCircle2,
  Stethoscope,
  Building2,
  PhoneCall,
  ArrowRight,
  Clock,
} from 'lucide-react';

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<'mission' | 'vision' | 'values'>('mission');

  const pillars = [
    {
      icon: ShieldCheck,
      title: 'KMPDB & PPB Certified',
      description: 'Every medical device in our catalog is vetted and compliant with Kenyan regulatory standards.',
    },
    {
      icon: Truck,
      title: 'Fast Nationwide Delivery',
      description: 'Same-day delivery across Nairobi metropolitan area and dispatch to all 47 counties within 24-48 hours.',
    },
    {
      icon: HeartHandshake,
      title: 'Direct Vendor Partnerships',
      description: 'We source directly from licensed global medical manufacturers to eliminate middleman price markups.',
    },
    {
      icon: Award,
      title: 'Warranty & After-Sales',
      description: 'Full manufacturer warranties, easy replacement guarantees, and dedicated technical support teams.',
    },
  ];

  const milestones = [
    { number: '15,000+', label: 'Healthcare Units Delivered' },
    { number: '500+', label: 'Vetted Medical Products' },
    { number: '47', label: 'Kenyan Counties Served' },
    { number: '99.2%', label: 'On-Time Delivery Rate' },
  ];

  return (
    <div className="min-h-screen py-10 sm:py-16 space-y-20 overflow-hidden">
      {/* --- HERO SECTION --- */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Kenya’s Preferred Medical Marketplace</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.15]">
              Empowering Every Kenyan Home & Clinic with <span className="text-primary">Trusted Medical Care</span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
              At <strong>MyMedDevices</strong>, we bridge the gap between world-class healthcare vendors and patients across Kenya. From vital sign monitors to clinical facility setups, we make certified medical equipment accessible, affordable, and dependable.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-foreground">100% Genuine Certified Devices</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-foreground">Transparent M-Pesa & Bank Checkout</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-foreground">Nairobi Express Same-Day Delivery</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-foreground">24/7 Clinical Support Helpdesk</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition-all"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact-us"
                className="inline-flex items-center justify-center gap-2 border border-border bg-card text-foreground px-6 py-3.5 rounded-xl font-semibold text-sm hover:bg-muted transition-all"
              >
                <PhoneCall className="w-4 h-4 text-muted-foreground" />
                <span>Talk to Healthcare Advisor</span>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative aspect-[4/3] sm:aspect-[16/11] rounded-3xl overflow-hidden shadow-2xl border border-border/80">
              <Image
                src="/images/about-us-hero.jpg"
                alt="Healthcare professional providing certified medical device to patient in Nairobi Kenya"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border/50 text-left shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Verified Medical Equipment</h4>
                    <p className="text-[11px] text-muted-foreground">Certified for home care & clinical practice</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- NUMERIC MILESTONES --- */}
      <section className="bg-muted/30 border-y border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {milestones.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border/70 shadow-sm"
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight mb-1">
                  {stat.number}
                </div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- WHY CHOOSE MYMEDDEVICES PILLARS --- */}
      <section className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Why Healthcare Providers & Families Trust Us
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            We operate with strict quality controls and transparent pricing so you receive reliable tools when health matters most.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col text-left"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{pillar.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{pillar.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* --- GUIDING TABBED SECTION --- */}
      <section className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="flex justify-center mb-8 border-b border-border">
            <div className="flex gap-2 pb-2 overflow-x-auto hide-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('mission')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'mission'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Our Mission
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('vision')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'vision'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Our Vision
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('values')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeTab === 'values'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Our Core Values
              </button>
            </div>
          </div>

          <div className="text-center max-w-2xl mx-auto min-h-[140px] flex items-center justify-center">
            {activeTab === 'mission' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-xl font-bold text-foreground mb-3">Empowering Independent Health Management</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To provide accessible, affordable, and certified medical devices that enable every Kenyan household and community clinic to monitor and manage health conditions confidently at home.
                </p>
              </motion.div>
            )}
            {activeTab === 'vision' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-xl font-bold text-foreground mb-3">A Healthier, Self-Reliant Kenya</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To become East Africa's most trusted digital healthcare procurement network, ensuring that no patient or medical clinic lacks immediate access to certified life-saving equipment.
                </p>
              </motion.div>
            )}
            {activeTab === 'values' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-xl font-bold text-foreground mb-3">Integrity, Quality & Patient Safety</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Uncompromising product authenticity, transparent pricing without hidden fees, and empathetic customer care form the cornerstone of every single delivery we make.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* --- CTA BANNER --- */}
      <section className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary/90 to-emerald-600 text-primary-foreground p-8 sm:p-12 shadow-xl text-left flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Need Help Finding the Right Medical Equipment?
            </h3>
            <p className="text-xs sm:text-sm text-primary-foreground/90 leading-relaxed">
              Our clinical advisory team is available to assist you in selecting certified monitors, mobility aids, or facility setup bundles.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Link
              href="/products"
              className="px-6 py-3.5 rounded-xl bg-white text-primary font-bold text-xs sm:text-sm shadow-md hover:bg-muted transition-all"
            >
              Shop Medical Catalog
            </Link>
            <Link
              href="/contact-us"
              className="px-6 py-3.5 rounded-xl bg-primary-foreground/10 text-white border border-white/30 font-semibold text-xs sm:text-sm hover:bg-white/20 transition-all"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
