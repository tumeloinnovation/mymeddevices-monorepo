"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertCircle,
  CreditCardIcon,
  PlusIcon,
  MoreVerticalIcon,
  Loader2,
  Smartphone,
  Building2,
  BadgeCheck,
  Trash2,
  Shield,
  ChevronDown,
} from "lucide-react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  customerPaymentMethodsApi,
  type PaymentMethod,
} from "@/lib/api/endpoints/payment-methods"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// ============================================================================
// Enhanced Payment Method Card Component
// ============================================================================

interface PaymentMethodCardProps {
  method: PaymentMethod
}

function PaymentMethodCard({ method }: PaymentMethodCardProps) {
  const queryClient = useQueryClient()
  const [showActions, setShowActions] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: () => customerPaymentMethodsApi.deletePaymentMethod(method.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
      toast.success("Payment method deleted")
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: () => customerPaymentMethodsApi.setDefault(method.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
      toast.success("Default payment method updated")
    },
  })

  const getCardStyles = () => {
    switch (method.payment_type) {
      case "mpesa":
        return {
          borderColor: "border-l-green-500",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          icon: <Smartphone className="size-5" />,
          accentColor: "#10B981",
        }
      case "card":
        return {
          borderColor: method.card_brand === "visa"
            ? "border-l-blue-600"
            : method.card_brand === "mastercard"
            ? "border-l-red-600"
            : "border-l-slate-600",
          iconBg: method.card_brand === "visa"
            ? "bg-blue-100"
            : method.card_brand === "mastercard"
            ? "bg-red-100"
            : "bg-slate-100",
          iconColor: method.card_brand === "visa"
            ? "text-blue-600"
            : method.card_brand === "mastercard"
            ? "text-red-600"
            : "text-slate-600",
          icon: <CreditCardIcon className="size-5" />,
          accentColor: method.card_brand === "visa" ? "#1A1F71" : method.card_brand === "mastercard" ? "#EB001B" : "#475569",
        }
      case "bank_transfer":
        return {
          borderColor: "border-l-slate-600",
          iconBg: "bg-slate-100",
          iconColor: "text-slate-600",
          icon: <Building2 className="size-5" />,
          accentColor: "#475569",
        }
      default:
        return {
          borderColor: "border-l-slate-400",
          iconBg: "bg-slate-100",
          iconColor: "text-slate-600",
          icon: <CreditCardIcon className="size-5" />,
          accentColor: "#475569",
        }
    }
  }

  const styles = getCardStyles()
  const isDefault = method.is_default

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative group"
      >
        <Card className={`border-l-4 ${styles.borderColor} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2.5 rounded-lg ${styles.iconBg} ${styles.iconColor} transition-transform group-hover:scale-110`}>
                  {styles.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base truncate">
                      {method.payment_type === "card"
                        ? `${method.card_brand?.toUpperCase()} •••• ${method.card_last4}`
                        : method.payment_type === "mpesa"
                        ? "M-Pesa"
                        : method.bank_name}
                    </CardTitle>
                    {isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <BadgeCheck className="size-3" />
                        Default
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowActions(!showActions)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {showActions ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <MoreVerticalIcon className="size-4" />
                  )}
                </Button>

                <AnimatePresence>
                  {showActions && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-8 z-10 w-48 bg-white rounded-lg shadow-lg border overflow-hidden"
                    >
                      {!isDefault && (
                        <button
                          onClick={() => {
                            setDefaultMutation.mutate()
                            setShowActions(false)
                          }}
                          disabled={setDefaultMutation.isPending}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                          {setDefaultMutation.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <BadgeCheck className="size-4" />
                          )}
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setDeleteDialogOpen(true)
                          setShowActions(false)
                        }}
                        disabled={deleteMutation.isPending}
                        className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {method.payment_type === "card" ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">{method.cardholder_name}</p>
                <p className="text-sm text-muted-foreground">
                  Expires {method.card_expiry_month}/{method.card_expiry_year}
                </p>
              </div>
            ) : method.payment_type === "mpesa" ? (
              <p className="text-sm text-muted-foreground font-medium">{method.phone_number}</p>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{method.bank_account_name}</p>
                <p className="text-sm text-muted-foreground">{method.bank_account_number}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payment Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment method? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ============================================================================
// Add Payment Method Dialog Component
// ============================================================================

function AddPaymentMethodDialog() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"mpesa" | "card" | "bank">("mpesa")
  const queryClient = useQueryClient()

  const createMpesaMutation = useMutation({
    mutationFn: (phone: string) =>
      customerPaymentMethodsApi.createMpesaMethod({ phone_number: phone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
      setOpen(false)
      toast.success("M-Pesa payment method added")
    },
    onError: (error: any) => {
      console.error("Failed to add M-Pesa payment method:", error)
    },
  })

  const createCardMutation = useMutation({
    mutationFn: (data: { card_token: string; card_last4: string; card_brand: string; card_expiry_month: string; card_expiry_year: string; cardholder_name: string }) =>
      customerPaymentMethodsApi.createCardMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
      setOpen(false)
      toast.success("Card payment method added")
    },
    onError: (error: any) => {
      console.error("Failed to add card payment method:", error)
    },
  })

  const createBankMutation = useMutation({
    mutationFn: (data: { bank_name: string; bank_account_number: string; bank_account_name: string }) =>
      customerPaymentMethodsApi.createBankMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
      setOpen(false)
      toast.success("Bank payment method added")
    },
    onError: (error: any) => {
      console.error("Failed to add bank payment method:", error)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (type === "mpesa") {
      const phone = formData.get("mpesaPhone") as string
      if (phone) {
        createMpesaMutation.mutate(phone)
      }
    } else if (type === "card") {
      const cardData = {
        card_token: formData.get("cardToken") as string,
        card_last4: formData.get("cardLast4") as string,
        card_brand: formData.get("cardBrand") as string,
        card_expiry_month: formData.get("cardExpiryMonth") as string,
        card_expiry_year: formData.get("cardExpiryYear") as string,
        cardholder_name: formData.get("cardholderName") as string,
      }
      createCardMutation.mutate(cardData)
    } else if (type === "bank") {
      const bankData = {
        bank_name: formData.get("bankName") as string,
        bank_account_number: formData.get("bankAccountNumber") as string,
        bank_account_name: formData.get("bankAccountName") as string,
      }
      createBankMutation.mutate(bankData)
    }
  }

  const isPending = createMpesaMutation.isPending || createCardMutation.isPending || createBankMutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="size-4 mr-2" />
          Add Payment Method
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Add a new payment method to your account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setType("mpesa")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                type === "mpesa"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="size-4" />
              M-Pesa
            </button>
            <button
              type="button"
              onClick={() => setType("card")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                type === "card"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CreditCardIcon className="size-4" />
              Card
            </button>
            <button
              type="button"
              onClick={() => setType("bank")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                type === "bank"
                  ? "bg-white text-slate-700 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="size-4" />
              Bank
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* M-Pesa Form */}
            {type === "mpesa" && (
              <motion.div
                key="mpesa"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="mpesaPhone">M-Pesa Phone Number</Label>
                  <Input
                    id="mpesaPhone"
                    name="mpesaPhone"
                    type="tel"
                    placeholder="+254 712 345678"
                    required
                    disabled={isPending}
                  />
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Smartphone className="size-3 mt-0.5 shrink-0" />
                  This will be used for M-Pesa STK push payments
                </p>
              </motion.div>
            )}

            {/* Card Form */}
            {type === "card" && (
              <motion.div
                key="card"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardLast4">Last 4 Digits</Label>
                    <Input
                      id="cardLast4"
                      name="cardLast4"
                      type="text"
                      placeholder="3456"
                      maxLength={4}
                      required
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardBrand">Card Brand</Label>
                    <select
                      id="cardBrand"
                      name="cardBrand"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                      disabled={isPending}
                    >
                      <option value="">Select brand</option>
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">American Express</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    name="cardholderName"
                    type="text"
                    placeholder="John Doe"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiryMonth">Expiry Month</Label>
                    <Input
                      id="cardExpiryMonth"
                      name="cardExpiryMonth"
                      type="text"
                      placeholder="MM"
                      maxLength={2}
                      required
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiryYear">Expiry Year</Label>
                    <Input
                      id="cardExpiryYear"
                      name="cardExpiryYear"
                      type="text"
                      placeholder="YYYY"
                      maxLength={4}
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardToken">Card Token (Test)</Label>
                  <Input
                    id="cardToken"
                    name="cardToken"
                    type="text"
                    placeholder="tok_test..."
                    required
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground">
                    For testing only. In production, this comes from the payment processor.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Bank Form */}
            {type === "bank" && (
              <motion.div
                key="bank"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    type="text"
                    placeholder="e.g., Equity Bank, KCB"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    name="bankAccountNumber"
                    type="text"
                    placeholder="Enter account number"
                    required
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountName">Account Holder Name</Label>
                  <Input
                    id="bankAccountName"
                    name="bankAccountName"
                    type="text"
                    placeholder="Name on account"
                    required
                    disabled={isPending}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Payment Method"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function PaymentMethodsPage() {
  const { data: paymentMethodsData, isLoading, error } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => customerPaymentMethodsApi.getPaymentMethods(),
  })

  const paymentMethods = paymentMethodsData || []

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Methods</h1>
          <p className="text-muted-foreground mt-2">
            Manage your payment options for faster checkout
          </p>
        </div>
        <AddPaymentMethodDialog />
      </div>

      {/* Payment Methods Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 py-6">
            <AlertCircle className="size-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Failed to load payment methods</p>
              <p className="text-sm text-muted-foreground">Please try again later</p>
            </div>
          </CardContent>
        </Card>
      ) : paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <CreditCardIcon className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No payment methods saved</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Add a payment method to make checkout faster and easier
            </p>
            <AddPaymentMethodDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {paymentMethods.map((method) => (
            <PaymentMethodCard key={method.id} method={method} />
          ))}
        </div>
      )}

      {/* Security Information */}
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-muted-foreground" />
            <CardTitle className="text-base">Security Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your payment information is securely stored and encrypted. We use industry-standard
            security measures to protect your data. M-Pesa transactions are secured by Safaricom's
            STK push protocol. Card details are tokenized and never stored in plain text.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
