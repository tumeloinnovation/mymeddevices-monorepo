'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    LifeBuoy,
    MessageSquare,
    Phone,
    Mail,
    Search,
    Package,
    CreditCard,
    RefreshCw,
    User,
    ChevronRight,
    HeadphonesIcon,
} from 'lucide-react';
import Link from 'next/link';

const faqCategories = [
    {
        id: 'orders',
        title: 'Orders & Shipping',
        icon: Package,
        items: [
            {
                q: 'How do I track my order?',
                a: 'Go to Dashboard > Orders > Tracking. You can also find the tracking link in your order confirmation email.',
            },
            {
                q: 'What are the shipping options?',
                a: 'We offer standard shipping (3-5 business days) and express shipping (1-2 business days) within Kenya.',
            },
            {
                q: 'Can I modify my order after placing it?',
                a: 'Orders can be modified within 1 hour of placement. Contact us immediately at support@mymeddevices.co.ke.',
            },
        ],
    },
    {
        id: 'payments',
        title: 'Payments & Pricing',
        icon: CreditCard,
        items: [
            {
                q: 'What payment methods do you accept?',
                a: 'We accept M-Pesa, credit/debit cards, and bank transfers. All payments are secure.',
            },
            {
                q: 'Is my payment information secure?',
                a: 'Yes! We use industry-standard encryption and never store your full card details on our servers.',
            },
            {
                q: 'How do I apply a discount code?',
                a: 'Enter your discount code at checkout before completing payment. Only one code per order.',
            },
        ],
    },
    {
        id: 'returns',
        title: 'Returns & Refunds',
        icon: RefreshCw,
        items: [
            {
                q: 'What is your return policy?',
                a: 'Medical devices can be returned within 30 days if unopened and in original packaging. Personal hygiene items cannot be returned.',
            },
            {
                q: 'How do I request a refund?',
                a: 'Go to Dashboard > Orders, find the order, and click "Request Refund". Refunds take 5-7 business days.',
            },
            {
                q: 'Who pays for return shipping?',
                a: 'We cover return shipping for defective items. For other returns, a small fee may apply.',
            },
        ],
    },
    {
        id: 'account',
        title: 'Account & Profile',
        icon: User,
        items: [
            {
                q: 'How do I update my profile?',
                a: 'Visit Dashboard > Profile to update your personal information, photo, and preferences.',
            },
            {
                q: 'Can I have multiple delivery addresses?',
                a: 'Yes! Go to Dashboard > Addresses to add and manage multiple delivery addresses.',
            },
            {
                q: 'How do loyalty points work?',
                a: 'Earn points on every purchase. 1000 points = Ksh 100 discount. Check your balance in Dashboard > Loyalty Rewards.',
            },
        ],
    },
];

const contactOptions = [
    {
        title: 'Live Chat',
        description: 'Chat with our support team',
        icon: MessageSquare,
        action: 'Start Chat',
        href: '#',
    },
    {
        title: 'Email Support',
        description: 'Send us a detailed message',
        icon: Mail,
        action: 'Email Us',
        href: 'mailto:support@mymeddevices.co.ke',
    },
    {
        title: 'Phone Support',
        description: 'Call for urgent issues',
        icon: Phone,
        action: 'Call Now',
        href: 'tel:+254700000000',
    },
    {
        title: 'Support Ticket',
        description: 'Create a ticket for help',
        icon: LifeBuoy,
        action: 'Create Ticket',
        href: '/dashboard/tickets/new',
    },
];

export default function SupportPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const filteredCategories = faqCategories.map((category) => ({
        ...category,
        items: category.items.filter(
            (item) =>
                item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    })).filter((category) => category.items.length > 0);

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 rounded-xl bg-muted/50">
                    <HeadphonesIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">How can we help?</h1>
                    <p className="text-muted-foreground mt-2">
                        Find answers or contact our support team
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search for help..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Contact Options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {contactOptions.map((option) => (
                    <Link href={option.href} key={option.title}>
                        <Card className="hover:bg-muted/30 transition-colors cursor-pointer h-full">
                            <CardContent className="p-4">
                                <div className="flex flex-col items-center text-center space-y-2">
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <option.icon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-sm">{option.title}</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* FAQ Section */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Browse by category or search for topics
                    </p>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={selectedCategory === null ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                    >
                        All Topics
                    </Button>
                    {faqCategories.map((category) => (
                        <Button
                            key={category.id}
                            variant={selectedCategory === category.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(category.id)}
                            className="gap-2"
                        >
                            <category.icon className="h-4 w-4" />
                            {category.title}
                        </Button>
                    ))}
                </div>

                {/* FAQ Accordion */}
                <div className="space-y-4">
                    {filteredCategories
                        .filter((cat) => selectedCategory === null || cat.id === selectedCategory)
                        .map((category) => (
                            <Card key={category.id} className="border-muted/40">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <category.icon className="h-4 w-4 text-muted-foreground" />
                                        {category.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="multiple" className="w-full">
                                        {category.items.map((item, index) => (
                                            <AccordionItem key={index} value={`${category.id}-${index}`}>
                                                <AccordionTrigger className="text-left hover:no-underline text-sm font-medium">
                                                    {item.q}
                                                </AccordionTrigger>
                                                <AccordionContent className="text-muted-foreground text-sm">
                                                    {item.a}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        ))}
                </div>

                {filteredCategories.every((cat) => cat.items.length === 0) && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground text-sm">No results found for "{searchQuery}"</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Try different keywords or{' '}
                                <Link href="/dashboard/tickets/new" className="text-foreground hover:underline">
                                    contact support
                                </Link>
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Still need help? */}
            <Card className="bg-muted/30 border-muted/40">
                <CardContent className="p-6 text-center">
                    <h3 className="font-medium mb-2">Still need help?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Our support team is available 24/7 to assist you
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button asChild>
                            <Link href="/dashboard/tickets/new">
                                <LifeBuoy className="h-4 w-4 mr-2" />
                                Create Support Ticket
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="mailto:support@mymeddevices.co.ke">
                                <Mail className="h-4 w-4 mr-2" />
                                Email Us
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
