"use client"

import { useState, useEffect } from "react"
import { 
  shoppingService, 
  type ShoppingCart, 
  type CartTotals, 
  type Order 
} from "@mymeddevices/shared-core"
import { catalogService } from "@mymeddevices/shared-core"
import { Product } from "@mymeddevices/shared-core"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ShoppingCartIcon, 
  PlusIcon, 
  CheckCircleIcon, 
  ArrowRightIcon, 
  Loader2Icon,
  PackageIcon,
  ReceiptIcon
} from "lucide-react"
import { toast } from "sonner"

export default function ShoppingPlayground() {
  const [loading, setLoading] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<ShoppingCart | null>(null)
  const [totals, setTotals] = useState<CartTotals | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [step, setStep] = useState(1)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading("products")
      const response = await catalogService.getStorefrontProducts({ page_size: 5 })
      setProducts(response.products)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast.error("Failed to load products for playground")
    } finally {
      setLoading(null)
    }
  }

  const handleInitCart = async () => {
    try {
      setLoading("cart")
      const myCart = await shoppingService.getMyCart()
      setCart(myCart)
      setStep(2)
      toast.success("Cart initialized successfully")
    } catch (error) {
      console.error("Failed to init cart:", error)
      toast.error("Failed to initialize cart")
    } finally {
      setLoading(null)
    }
  }

  const handleAddToCart = async (productId: string) => {
    try {
      setLoading(`add-${productId}`)
      await shoppingService.addToCart(productId, 1)
      const myCart = await shoppingService.getMyCart()
      setCart(myCart)
      toast.success("Product added to cart")
    } catch (error) {
      console.error("Failed to add to cart:", error)
      toast.error("Failed to add product to cart")
    } finally {
      setLoading(null)
    }
  }

  const handleGetTotals = async () => {
    if (!cart) return
    try {
      setLoading("totals")
      const cartTotals = await shoppingService.getCartTotals(cart.id)
      setTotals(cartTotals)
      setStep(3)
    } catch (error) {
      console.error("Failed to get totals:", error)
      toast.error("Failed to calculate totals")
    } finally {
      setLoading(null)
    }
  }

  const handleCheckout = async () => {
    if (!cart) return
    try {
      setLoading("checkout")
      const newOrder = await shoppingService.checkout({
        cart_id: cart.id,
        shipping_address: {
          full_name: "Playground User",
          address_line1: "123 DX Street",
          city: "Nairobi",
          country: "Kenya"
        },
        notes: "DX Playground Order"
      })
      setOrder(newOrder)
      setStep(4)
      toast.success("Order placed successfully!")
    } catch (error) {
      console.error("Failed to checkout:", error)
      toast.error("Checkout failed")
    } finally {
      setLoading(null)
    }
  }

  const resetPlayground = () => {
    setCart(null)
    setTotals(null)
    setOrder(null)
    setStep(1)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shopping Playground</h1>
          <p className="text-muted-foreground">Test the end-to-end shopping workflow in real-time.</p>
        </div>
        {step > 1 && (
          <Button variant="outline" size="sm" onClick={resetPlayground}>
            Reset Workflow
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { s: 1, label: "Init Cart", icon: ShoppingCartIcon },
          { s: 2, label: "Add Items", icon: PlusIcon },
          { s: 3, label: "Totals", icon: ReceiptIcon },
          { s: 4, label: "Order", icon: CheckCircleIcon },
        ].map((item) => (
          <div 
            key={item.s}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              step >= item.s ? "bg-primary/5 border-primary text-primary" : "bg-muted/50 text-muted-foreground"
            }`}
          >
            <div className={`flex size-8 items-center justify-center rounded-full border ${
              step >= item.s ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground/30"
            }`}>
              {step > item.s ? <CheckCircleIcon className="size-4" /> : <item.icon className="size-4" />}
            </div>
            <span className="font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interaction Area */}
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Initialize Shopping Session</CardTitle>
                <CardDescription>
                  Start by creating a new cart session. This simulates a customer arriving at the storefront.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-8">
                <Button 
                  size="lg" 
                  onClick={handleInitCart}
                  disabled={loading === "cart"}
                >
                  {loading === "cart" ? (
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                  ) : (
                    <ShoppingCartIcon className="mr-2 size-4" />
                  )}
                  Create New Cart
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Step 2: Add Products to Cart</h3>
                <Button 
                  variant="secondary"
                  onClick={handleGetTotals}
                  disabled={!cart?.items?.length || loading === "totals"}
                >
                  {loading === "totals" ? (
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                  ) : (
                    <>
                      Calculate Totals
                      <ArrowRightIcon className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.length === 0 && loading === "products" ? (
                  Array(4).fill(0).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-40 bg-muted rounded-t-lg" />
                      <CardContent className="p-4 space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded" />
                        <div className="h-4 w-1/4 bg-muted rounded" />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  products.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        <PackageIcon className="size-12 text-muted-foreground/20" />
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="text-base truncate">{product.name}</CardTitle>
                        <CardDescription className="font-bold text-primary">
                          {product.currency} {product.price?.toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="p-4 pt-0">
                        <Button 
                          className="w-full" 
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToCart(product.id)}
                          disabled={loading === `add-${product.id}`}
                        >
                          {loading === `add-${product.id}` ? (
                            <Loader2Icon className="size-4 animate-spin" />
                          ) : (
                            <>
                              <PlusIcon className="mr-2 size-4" />
                              Add to Cart
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Review & Checkout</CardTitle>
                <CardDescription>
                  Review the calculated totals and confirm the order.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>KES {totals?.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>KES 0</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">KES {totals?.total?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-card space-y-3">
                  <h4 className="font-medium text-sm">Shipping Information (Mock)</h4>
                  <div className="text-sm text-muted-foreground">
                    <p>Playground User</p>
                    <p>123 DX Street, Nairobi, Kenya</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Back to Products
                </Button>
                <Button 
                  size="lg" 
                  onClick={handleCheckout}
                  disabled={loading === "checkout"}
                >
                  {loading === "checkout" ? (
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                  ) : (
                    <CheckCircleIcon className="mr-2 size-4" />
                  )}
                  Confirm Order
                </Button>
              </CardFooter>
            </Card>
          )}

          {step === 4 && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">
                  <CheckCircleIcon className="size-6" />
                </div>
                <CardTitle className="text-green-700">Order Successful!</CardTitle>
                <CardDescription>
                  The shopping experience workflow has been completed successfully.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md mx-auto">
                <div className="flex justify-between items-center p-3 bg-white dark:bg-zinc-900 rounded border">
                  <span className="text-sm font-medium">Order ID</span>
                  <span className="text-xs font-mono text-muted-foreground uppercase">{order?.id.split('-')[0]}...</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-zinc-900 rounded border">
                  <span className="text-sm font-medium">Status</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase">
                    {order?.status}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white dark:bg-zinc-900 rounded border">
                  <span className="text-sm font-medium">Final Amount</span>
                  <span className="font-bold text-primary">KES {order?.total_amount?.toLocaleString()}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center pb-8">
                <Button variant="outline" onClick={resetPlayground}>
                  Start New Playground Session
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Sidebar Status / Logs */}
        <div className="space-y-6">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Active Cart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!cart ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <ShoppingCartIcon className="size-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No active session</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Items in cart</span>
                    <span className="font-bold">{cart.items?.length || 0}</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                    {cart.items?.map((item) => (
                      <div key={item.id} className="flex gap-2 p-2 bg-muted/30 rounded text-xs border">
                        <div className="size-8 rounded bg-muted flex items-center justify-center shrink-0">
                          <PackageIcon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.product?.name}</p>
                          <p className="text-muted-foreground">Qty: {item.quantity} × {item.unit_price}</p>
                        </div>
                      </div>
                    ))}
                    {!cart.items?.length && (
                      <p className="text-center text-[10px] py-4 text-muted-foreground">Cart is empty</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">API Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative pl-4 border-l border-muted space-y-4">
                  {step >= 1 && (
                    <div className="relative">
                      <div className="absolute -left-[1.35rem] top-1 size-2.5 rounded-full bg-primary" />
                      <p className="text-xs font-medium">GET /shopping/cart/my</p>
                      <p className="text-[10px] text-muted-foreground">Initialize session</p>
                    </div>
                  )}
                  {cart?.items?.length ? (
                    <div className="relative">
                      <div className="absolute -left-[1.35rem] top-1 size-2.5 rounded-full bg-primary" />
                      <p className="text-xs font-medium">POST /shopping/cart/items</p>
                      <p className="text-[10px] text-muted-foreground">Item(s) added</p>
                    </div>
                  ) : null}
                  {step >= 3 && (
                    <div className="relative">
                      <div className="absolute -left-[1.35rem] top-1 size-2.5 rounded-full bg-primary" />
                      <p className="text-xs font-medium">GET /shopping/cart/totals</p>
                      <p className="text-[10px] text-muted-foreground">Calculate snapshot</p>
                    </div>
                  )}
                  {step >= 4 && (
                    <div className="relative">
                      <div className="absolute -left-[1.35rem] top-1 size-2.5 rounded-full bg-primary" />
                      <p className="text-xs font-medium">POST /shopping/checkout</p>
                      <p className="text-[10px] text-muted-foreground">Order conversion</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Separator() {
  return <div className="h-px w-full bg-border my-2" />
}
