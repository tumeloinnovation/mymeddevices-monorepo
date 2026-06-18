'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import useCartStore from '@/lib/store/useCartStore';
import { formatCurrency } from '@/lib/utils/utils';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import Link from 'next/link';

export default function WishlistPage() {
    const wishlistItems = useWishlistStore((state) => state.items);
    const removeFromWishlist = useWishlistStore((state) => state.removeItem);
    const addToCart = useCartStore((state) => state.addItem);

    const handleAddToCart = (item: any) => {
        addToCart(item);
        toast.success(`${item.name} added to cart!`);
    };

    const handleRemove = (itemId: number | string) => {
        removeFromWishlist(itemId);
        toast.success('Removed from wishlist');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">My Wishlist</h1>
                    <p className="text-muted-foreground mt-2">
                        {wishlistItems.length} item(s) saved for later
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        Saved Items
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {wishlistItems.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Image</TableHead>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-center">Stock Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {wishlistItems.map((item) => (
                                        <TableRow key={item.id}>
                                            {/* Product Image */}
                                            <TableCell>
                                                <Link href={`/products/${item.slug || item.id}`}>
                                                    <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted">
                                                        <Image
                                                            src={
                                                                (Array.isArray(item.images) && item.images[0]?.src) ||
                                                                (typeof item.images === 'string' ? item.images : '') ||
                                                                '/logos/logo-portrait.png'
                                                            }
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="64px"
                                                        />
                                                    </div>
                                                </Link>
                                            </TableCell>

                                            {/* Product Name */}
                                            <TableCell>
                                                <Link
                                                    href={`/products/${item.slug || item.id}`}
                                                    className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
                                                >
                                                    {item.name}
                                                </Link>
                                            </TableCell>

                                            {/* Price */}
                                            <TableCell className="text-right">
                                                <div className="space-y-1">
                                                    <p className="font-semibold text-primary">
                                                        Ksh {formatCurrency(parseFloat(item.price))}
                                                    </p>
                                                    {item.regular_price &&
                                                        parseFloat(item.regular_price) > parseFloat(item.price) && (
                                                            <p className="text-sm text-muted-foreground line-through">
                                                                Ksh {formatCurrency(parseFloat(item.regular_price))}
                                                            </p>
                                                        )}
                                                </div>
                                            </TableCell>

                                            {/* Stock Status */}
                                            <TableCell className="text-center">
                                                <span
                                                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${item.stock_status === 'instock'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    {item.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
                                                </span>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="gap-2"
                                                        onClick={() => handleAddToCart(item)}
                                                        disabled={item.stock_status !== 'instock'}
                                                    >
                                                        <ShoppingCart className="h-4 w-4" />
                                                        <span className="hidden sm:inline">Add to Cart</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleRemove(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="py-12">
                            <EmptyState
                                title="Your wishlist is empty"
                                description="Save items you love for later by clicking the heart icon on product pages"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
