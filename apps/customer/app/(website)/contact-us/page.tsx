import { Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Contact Us - MyMedDevices',
  description:
    "Get in touch with MyMedDevices for inquiries, orders, or support. We're here to help you find the best home-based medical devices in Kenya.",
};

export default function ContactUsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header Section */}
      <section className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 text-foreground">Contact Us</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Have a question or need assistance? We’re here to help you with your orders, product
          details, or after-sales support.
        </p>
      </section>

      {/* Contact Info Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="bg-card p-6 rounded-2xl shadow-sm text-center border border-border">
          <Mail className="mx-auto text-primary mb-2" size={32} />
          <h3 className="font-bold mb-1">Email Us</h3>
          <p className="text-sm text-muted-foreground">support@mymeddevices.com</p>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm text-center border border-border">
          <Phone className="mx-auto text-primary mb-2" size={32} />
          <h3 className="font-bold mb-1">Call or WhatsApp</h3>
          <p className="text-sm text-muted-foreground">
            Call Centre:{' '}
            <Link href="tel:+254734585958" className="hover:underline">
              +254 707 757 088
            </Link>
            <br />
            WhatsApp:{' '}
            <Link
              href="https://api.whatsapp.com/send?phone=254735239696"
              className="hover:underline"
            >
              +254 735 239 696
            </Link>
          </p>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-sm text-center border border-border">
          <MapPin className="mx-auto text-primary mb-2" size={32} />
          <h3 className="font-bold mb-1">Visit Us</h3>
          <p className="text-sm text-muted-foreground">
            Nairobi, Kenya — Same-day delivery available in major towns
          </p>
        </div>
      </section>

      {/* Form + Map */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <h2 className="text-xl font-bold mb-4">Send us a message</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                placeholder="Your full name"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                rows={4}
                placeholder="How can we help you?"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition w-full"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Google Map / Office */}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-border">
          <iframe
            title="MyMedDevices Location"
            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d31910.31452458839!2d36.800787!3d-1.301305!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1093aa5ceef5%3A0x3a842cd47703d3d!2s47%20Muchai%20Dr%2C%20Nairobi%2C%20Kenya!5e0!3m2!1sen!2sus!4v1759912728637!5m2!1sen!2sus"
            width="100%"
            height="100%"
            allowFullScreen
            loading="lazy"
          ></iframe>
        </div>
      </section>

      {/* Business Hours */}
      <section className="mt-12 text-center">
        <h2 className="text-xl font-bold mb-3">Business Hours</h2>
        <p className="text-sm text-muted-foreground">
          Monday - Friday: 8:30 AM – 6:00 PM
          <br />
          Saturday: 9:00 AM – 4:00 PM
          <br />
          Sunday & Holidays: Closed
        </p>
      </section>

      {/* CTA */}
      <section className="mt-12 bg-primary/10 border border-border rounded-2xl p-6 text-center">
        <h3 className="text-xl font-bold mb-2">Prefer chatting? We’re on WhatsApp!</h3>
        <Link
          href="https://api.whatsapp.com/send?phone=254735239696"
          className="inline-flex bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Chat on WhatsApp
        </Link>
      </section>
    </div>
  );
}
